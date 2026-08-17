import type { Subscription } from "../domain/subscription";

const STORAGE_KEY = "quotapilot.subscriptions";

export class SubscriptionService {
  getAll(): Subscription[] {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as Subscription[];
  }

  save(subscription: Subscription): void {
    const subscriptions = this.getAll();

    const existingIndex = subscriptions.findIndex(
      (item) => item.id === subscription.id
    );

    if (existingIndex >= 0) {
      subscriptions[existingIndex] = subscription;
    } else {
      subscriptions.push(subscription);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  }

  delete(subscriptionId: string): void {
    const subscriptions = this.getAll().filter(
      (item) => item.id !== subscriptionId
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  }
}
