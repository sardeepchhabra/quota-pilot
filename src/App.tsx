import { useEffect, useMemo, useState } from "react";
import type { ProviderAccount } from "./providers/provider";
import type { ProviderSnapshot } from "./domain/quota";
import { ProviderService } from "./services/provider-service";
import { createProviderRegistry } from "./providers";
import "./App.css";
import { SubscriptionService } from "./services/subscription-service";
import type { Subscription } from "./domain/subscription";
import { getCodexSnapshot, type CodexSnapshot } from "./services/codex-service";
import { SnapshotService } from "./services/snapshot-service";

const providerService = new ProviderService(createProviderRegistry());
const subscriptionService = new SubscriptionService();
const snapshotService = new SnapshotService();

function capabilityLabel(snapshot: ProviderSnapshot, id: string) {
  return snapshot.account.capabilities.find(
    (capability) => capability.id === id,
  );
}

function App() {
  const [snapshots, setSnapshots] = useState<ProviderSnapshot[]>(() =>
    snapshotService.loadProviderSnapshots(),
  );
  const [loading, setLoading] = useState(true);
  const [subscriptions] = useState<Subscription[]>(() =>
    subscriptionService.getAll(),
  );
  const [showChatGPTSetup, setShowChatGPTSetup] = useState(false);
  const [codex, setCodex] = useState<CodexSnapshot | null>(() =>
    snapshotService.loadCodexSnapshot(),
  );
  const [codexError, setCodexError] = useState<string | null>(null);

  const connectedAccounts = useMemo(
    () => snapshots.length + (codex ? 1 : 0),
    [codex, snapshots.length],
  );

  const availableQuotaCount = useMemo(() => {
    const providerQuotaCount = snapshots.filter((snapshot) =>
      snapshot.quotas.some(
        (quota) =>
          quota.percentageRemaining !== undefined || quota.remaining !== undefined,
      ),
    ).length;

    const codexQuotaCount = codex && codex.remaining_percent != null ? 1 : 0;

    return providerQuotaCount + codexQuotaCount;
  }, [codex, snapshots]);

  const refreshProviders = async () => {
    const accounts: ProviderAccount[] = await providerService.getAccounts();

    const results = await Promise.all(
      accounts.map((account) => providerService.getSnapshot(account)),
    );

    setSnapshots(results);
    snapshotService.saveProviderSnapshots(results);

    return results;
  };

  const refreshCodex = async () => {
    const nextSnapshot = await getCodexSnapshot();

    setCodex(nextSnapshot);
    setCodexError(null);
    snapshotService.saveCodexSnapshot(nextSnapshot);

    return nextSnapshot;
  };

  const refreshAll = async () => {
    setLoading(true);

    try {
      await refreshProviders();
    } catch (error) {
      setCodexError(
        error instanceof Error ? error.message : "Unable to refresh providers.",
      );
    }

    try {
      await refreshCodex();
    } catch (error) {
      setCodexError(
        error instanceof Error ? error.message : "Unable to refresh Codex.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshAll();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>QuotaPilot</h1>
          <p>Know your AI headroom.</p>
        </div>

        <button className="refresh-button" onClick={() => void refreshAll()}>
          Refresh
        </button>
      </header>

      <section className="summary">
        <div>
          <span className="label">Connected accounts</span>
          <strong>{connectedAccounts}</strong>
        </div>

        <div>
          <span className="label">Available quotas</span>
          <strong>{availableQuotaCount}</strong>
        </div>

        <div>
          <span className="label">Status</span>
          <strong>{loading ? "Updating" : "Up to date"}</strong>
        </div>
      </section>

      <section className="providers">
        <div className="section-header">
          <h2>AI Accounts</h2>
          <span>{connectedAccounts} connected</span>
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
                    {subscription?.planName ?? snapshot.account.plan ?? "Unknown"}
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
                    Renews: {new Date(subscription.renewsAt).toLocaleDateString()}
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

      {codex && (
        <article className="provider-card">
          <div className="provider-card-header">
            <div>
              <h3>Codex</h3>
              <p>{codex.email ?? "Authenticated Codex account"}</p>
            </div>

            <span className="status-dot">●</span>
          </div>

          <div className="plan">
            <span className="label">Plan</span>
            <strong>{codex.plan_type ?? "Unknown"}</strong>
          </div>

          <div className="quota">
            <strong>
              {codex.remaining_percent != null
                ? `${Math.round(codex.remaining_percent)}%`
                : "—"}
            </strong>
            <span>remaining</span>
          </div>

          {codex.resets_at && (
            <p className="reset">
              Reset: {new Date(codex.resets_at * 1000).toLocaleString()}
            </p>
          )}

          <div className="provider-meta">
            <span>Source: Codex app-server</span>
          </div>
        </article>
      )}

      {codexError && (
        <article className="provider-card">
          <h3>Codex</h3>
          <p>{codexError}</p>
          <span className="provider-meta">
            Connect/authenticate Codex and try again.
          </span>
        </article>
      )}

      {showChatGPTSetup && (
        <div className="provider-card">
          <h3>Subscription prompt</h3>
          <p>Manual ChatGPT tracking is available in the subscription ledger.</p>
          <button className="primary-button" onClick={() => setShowChatGPTSetup(false)}>
            Close
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
