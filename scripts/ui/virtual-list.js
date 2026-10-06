/**
 * Small dependency-free fixed-row virtualizer. It keeps DOM size bounded even
 * when the underlying collection contains thousands of rows.
 */
export class FixedRowVirtualList {
  constructor({ container, rowHeight, overscan = 8, renderRow }) {
    if (!(container instanceof HTMLElement)) throw new TypeError("container must be an HTMLElement.");
    if (!Number.isFinite(rowHeight) || rowHeight <= 0) throw new RangeError("rowHeight must be positive.");
    if (typeof renderRow !== "function") throw new TypeError("renderRow must be a function.");

    this.container = container;
    this.rowHeight = rowHeight;
    this.overscan = overscan;
    this.renderRow = renderRow;
    this.items = [];
    this.frame = null;

    this.spacer = document.createElement("div");
    this.spacer.className = "virtual-spacer";
    this.container.replaceChildren(this.spacer);

    this._onScroll = () => this.schedule();
    this.container.addEventListener("scroll", this._onScroll, { passive: true });
  }

  setItems(items, { preserveScroll = true } = {}) {
    const scrollTop = preserveScroll ? this.container.scrollTop : 0;
    this.items = Array.isArray(items) ? items : [];
    const contentHeight = this.items.length * this.rowHeight;
    this.spacer.style.height = `${contentHeight}px`;
    this.container.scrollTop = Math.min(scrollTop, Math.max(0, contentHeight - this.container.clientHeight));
    this.render();
  }

  schedule() {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.render();
    });
  }

  render() {
    const viewportHeight = Math.max(this.container.clientHeight, this.rowHeight);
    const start = Math.max(0, Math.floor(this.container.scrollTop / this.rowHeight) - this.overscan);
    const visibleCount = Math.ceil(viewportHeight / this.rowHeight) + this.overscan * 2;
    const end = Math.min(this.items.length, start + visibleCount);
    const fragment = document.createDocumentFragment();

    for (let index = start; index < end; index += 1) {
      const row = this.renderRow(this.items[index], index);
      row.classList.add("virtual-row");
      row.style.top = `${index * this.rowHeight}px`;
      row.style.height = `${this.rowHeight}px`;
      fragment.append(row);
    }

    this.spacer.replaceChildren(fragment);
  }

  destroy() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.container.removeEventListener("scroll", this._onScroll);
    this.container.replaceChildren();
  }
}
