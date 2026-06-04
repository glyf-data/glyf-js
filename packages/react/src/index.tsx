import {
  GlyfClient,
  type GlyfArtifactKind,
  type GlyfChart as GlyfChartSpec,
  type GlyfClientOptions,
} from "@glyf/client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface GlyfProviderProps extends GlyfClientOptions {
  bundleUrl: string;
  children: ReactNode;
  loading?: ReactNode;
  error?: (error: Error) => ReactNode;
}

export interface GlyfContextValue {
  client: GlyfClient;
}

export interface GlyfChartProps {
  name: string;
  artifact?: Extract<GlyfArtifactKind, "svg" | "png">;
  title?: string;
  showTitle?: boolean;
  className?: string;
  imageClassName?: string;
  footer?: ReactNode;
  fallback?: ReactNode;
}

const GlyfContext = createContext<GlyfContextValue | null>(null);

export function GlyfProvider({
  bundleUrl,
  headers,
  credentials,
  fetcher,
  children,
  loading = <div>Loading Glyf bundle...</div>,
  error,
}: GlyfProviderProps) {
  const [client, setClient] = useState<GlyfClient | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setClient(null);
    setLoadError(null);

    GlyfClient.load({ bundleUrl, headers, credentials, fetcher })
      .then((nextClient) => {
        if (!cancelled) {
          setClient(nextClient);
        }
      })
      .catch((nextError: Error) => {
        if (!cancelled) {
          setLoadError(nextError);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bundleUrl, headers, credentials, fetcher]);

  const value = useMemo(() => (client ? { client } : null), [client]);

  if (loadError) {
    return error ? <>{error(loadError)}</> : <div>{loadError.message}</div>;
  }

  if (!value) {
    return <>{loading}</>;
  }

  return <GlyfContext.Provider value={value}>{children}</GlyfContext.Provider>;
}

export function useGlyfClient(): GlyfClient {
  const value = useContext(GlyfContext);
  if (!value) {
    throw new Error("useGlyfClient must be used inside GlyfProvider");
  }
  return value.client;
}

export function useGlyfChart(name: string): GlyfChartSpec | undefined {
  return useGlyfClient().getChart(name);
}

export function GlyfChart({
  name,
  artifact = "svg",
  title,
  showTitle = true,
  className,
  imageClassName,
  footer,
  fallback,
}: GlyfChartProps) {
  const client = useGlyfClient();
  const chart = client.getChart(name);
  const src =
    client.chartArtifactUrl(name, artifact) ??
    client.chartArtifactUrl(name, artifact === "svg" ? "png" : "svg");

  if (!chart || !src) {
    return fallback ? <>{fallback}</> : null;
  }

  const resolvedTitle = title ?? chart.title ?? name;

  return (
    <figure className={className} data-glyf-chart={name}>
      {showTitle ? <figcaption>{resolvedTitle}</figcaption> : null}
      <img
        className={imageClassName}
        src={src}
        alt={resolvedTitle}
        loading="lazy"
      />
      {footer ? <div>{footer}</div> : null}
    </figure>
  );
}

export function GlyfChartLink({ name, children }: { name: string; children: ReactNode }) {
  const client = useGlyfClient();
  const href = client.chartArtifactUrl(name, "metadata");
  if (!href) {
    return <>{children}</>;
  }
  return <a href={href}>{children}</a>;
}

export type {
  GlyfBundle,
  GlyfChartArtifacts,
  GlyfDashboard,
} from "@glyf/client";
export type { GlyfChartSpec };
