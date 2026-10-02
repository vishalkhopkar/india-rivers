import type { IControl } from "maplibre-gl";

// "Show river basins" switch for the top-right corner. Basins aren't drawn yet, so for
// now it only keeps its own on/off state and reports changes through onChange.
export class BasinsToggle implements IControl {
  private el?: HTMLElement;

  constructor(private readonly onChange: (on: boolean) => void = () => {}) {}

  onAdd(): HTMLElement {
    const el = document.createElement("div");
    el.className = "maplibregl-ctrl basins-toggle";
    el.innerHTML = `<label><span>Show river basins</span><input type="checkbox" role="switch" /></label>`;
    const input = el.querySelector("input") as HTMLInputElement;
    input.addEventListener("change", () => this.onChange(input.checked));
    this.el = el;
    return el;
  }

  onRemove(): void {
    this.el?.remove();
  }
}
