import { effect, inject, Injectable, signal, Type } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterEvent,
  Event,
} from '@angular/router';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export const NavigationEvent = {
  Cancel: NavigationCancel,
  End: NavigationEnd,
  Error: NavigationError,
  Start: NavigationStart,
};

@Injectable({ providedIn: 'root' })
export class RouterEvents {
  private readonly router = inject(Router);

  private readonly navigation$ = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)) as Observable<NavigationEnd>,
  );

  readonly #navigations = signal<NavigationEnd[]>([]);
  readonly navigations = this.#navigations.asReadonly();

  constructor() {
    effect(
      () => {
        const navigation = this.navigation$();
        if (navigation) {
          this.#navigations.update(navigations => [...navigations.slice(-1), navigation]);
        }
      },
      { allowSignalWrites: true },
    );
  }

  getEvents<T extends RouterEventConstructors>(...eventTypes: T) {
    const filterRouterEvents = (event: Event) => eventTypes.some(type => event instanceof type);

    return this.router.events.pipe(filter(filterRouterEvents));
  }

  getNavigationEvents<T extends NavigationEventKeys>(...navigationEventKeys: T) {
    type FilteredNavigationEvent = T extends (infer Key)[]
      ? Key extends NavigationEventKey
        ? InstanceType<NavigationEventType[Key]>
        : never
      : never;

    const filterNavigationEvents = (event: Event): event is FilteredNavigationEvent =>
      navigationEventKeys.some(key => event instanceof NavigationEvent[key]);

    return this.router.events.pipe(filter(filterNavigationEvents));
  }

  getAllEvents() {
    return this.router.events;
  }

  getAllNavigationEvents() {
    const keys = Object.keys(NavigationEvent) as NavigationEventKeys;
    return this.getNavigationEvents(...keys);
  }
}

type RouterEventConstructors = [Type<RouterEvent>, ...Type<RouterEvent>[]];

type NavigationEventKeys = [NavigationEventKey, ...NavigationEventKey[]];

type NavigationEventType = typeof NavigationEvent;

export type NavigationEventKey = keyof NavigationEventType;
