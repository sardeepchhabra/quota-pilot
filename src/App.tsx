import { useEffect, useState } from "react";
import type { ProviderAccount } from "./providers/provider";
import type { ProviderSnapshot } from "./domain/quota";
import { ProviderService } from "./services/provider-service";
import { createProviderRegistry } from "./providers";
import "./App.css";
import { ManualSubscriptionForm } from "./components/ManualSubscriptionForm";
import { SubscriptionService } from "./services/subscription-service";
import { PROVIDER_CATALOG } from "./providers/provider-catalog";
import type { Subscription } from "./domain/subscription";
const providerService = new ProviderService(createProviderRegistry());
const subscriptionService = new SubscriptionService();
function capabilityLabel(snapshot: ProviderSnapshot, id: string) {
  return snapshot.account.capabilities.find(
    (capability) => capability.id === id
  );
}

function App() {
  const [snapshots, setSnapshots] = useState<ProviderSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    subscriptionService.getAll()
  );

  const [showChatGPTSetup, setShowChatGPTSetup] = useState(false);

  const saveSubscription = (subscription: Subscription) => {
    subscriptionService.save(subscription);

    setSubscriptions(subscriptionService.getAll());
    setShowChatGPTSetup(false);
  };
  const loadProviders = async () => {
    setLoading(true);

    try {
      const accounts: ProviderAccount[] = await providerService.getAccounts();

      const results = await Promise.all(
        accounts.map((account) => providerService.getSnapshot(account))
      );

      setSnapshots(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProviders();
  }, []);

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>QuotaPilot</h1>
          <p>Know your AI headroom.</p>
        </div>

        <button className="refresh-button" onClick={() => void loadProviders()}>
          Refresh
        </button>
      </header>

      <section className="summary">
        <div>
          <span className="label">Connected accounts</span>
          <strong>{snapshots.length}</strong>
        </div>

        <div>
          <span className="label">Available quotas</span>
          <strong>{snapshots.filter((s) => s.quotas.length > 0).length}</strong>
        </div>

        <div>
          <span className="label">Status</span>
          <strong>{loading ? "Updating" : "Up to date"}</strong>
        </div>
      </section>

      <section className="providers">
        <div className="section-header">
          <h2>AI Accounts</h2>
          <span>{snapshots.length} connected</span>
        </div>

        <div className="provider-grid">
          {snapshots.map((snapshot) => {
            const quota = snapshot.quotas[0];
            const subscription = snapshot.subscription;

            const usageCapability = capabilityLabel(snapshot, "usage");

            return (
              <article className="provider-card" key={snapshot.account.id}>
                <div className="provider-card-header">
                  <div>
                    <h3>{snapshot.account.providerId}</h3>
                    <p>{snapshot.account.displayName}</p>
                  </div>

                  <span className="status-dot">●</span>
                </div>

                <div className="plan">
                  <span className="label">Plan</span>
                  <strong>
                    {subscription?.planName ??
                      snapshot.account.plan ??
                      "Unknown"}
                  </strong>
                </div>

                <div className="quota">
                  {quota?.percentageRemaining !== undefined ? (
                    <>
                      <strong>{quota.percentageRemaining}%</strong>
                      <span>remaining</span>
                    </>
                  ) : (
                    <>
                      <strong>—</strong>
                      <span>
                        {usageCapability?.availability === "not-supported"
                          ? "usage unavailable"
                          : "not connected"}
                      </span>
                    </>
                  )}
                </div>

                {quota?.resetsAt && (
                  <p className="reset">
                    Resets: {new Date(quota.resetsAt).toLocaleString()}
                  </p>
                )}

                {subscription?.renewsAt && (
                  <p className="reset">
                    Renews:{" "}
                    {new Date(subscription.renewsAt).toLocaleDateString()}
                  </p>
                )}

                <div className="capabilities">
                  {snapshot.account.capabilities.map((capability) => (
                    <span
                      className={`capability ${capability.availability}`}
                      key={capability.id}
                    >
                      {capability.id}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="subscriptions">
        <div className="section-header">
          <h2>Subscriptions</h2>
          <span>{subscriptions.length} tracked</span>
        </div>

        {subscriptions.map((subscription) => (
          <article className="subscription-card" key={subscription.id}>
            <div>
              <h3>{subscription.providerId}</h3>
              <p>{subscription.planName}</p>
            </div>

            <div>
              {subscription.price !== undefined && (
                <strong>
                  {subscription.currency} {subscription.price}
                </strong>
              )}

              <span>{subscription.billingCycle}</span>
            </div>

            {subscription.renewsAt && (
              <p>
                Renews: {new Date(subscription.renewsAt).toLocaleDateString()}
              </p>
            )}

            <small>Source: {subscription.source}</small>
          </article>
        ))}

        <div className="add-provider">
          <h3>Add a provider subscription</h3>

          <p>
            Some providers do not expose subscription or quota information
            through an API. You can still track their subscription locally.
          </p>

          <button
            className="primary-button"
            onClick={() => setShowChatGPTSetup(true)}
          >
            Add ChatGPT
          </button>
        </div>
      </section>

      {showChatGPTSetup && (
        <ManualSubscriptionForm
          providerId="chatgpt"
          onSave={saveSubscription}
          onCancel={() => setShowChatGPTSetup(false)}
        />
      )}
    </main>
  );
}

export default App;
