export interface Screen {
  mount(root: HTMLElement): void;
  unmount(): void;
}

export interface Navigator {
  go(factory: (nav: Navigator) => Screen): void;
}

/** Minimal screen router: swaps the contents of a root element, giving the
 *  outgoing screen a chance to clean up (stop the mic, cancel animation
 *  frames, etc.) before the next one mounts. */
export class Router implements Navigator {
  private current: Screen | null = null;

  constructor(private root: HTMLElement) {}

  go(factory: (nav: Navigator) => Screen): void {
    this.current?.unmount();
    this.root.innerHTML = '';
    const screen = factory(this);
    this.current = screen;
    screen.mount(this.root);
  }
}
