// @glyf-data/react: React bindings for @glyf-data/embed. The embed core does the
// drawing, filtering and theming; these components mount it into React's
// tree and keep it in step with props.

import {
  createGlyf,
  type ActiveFilter,
  type ChartState,
  type Glyf,
  type GlyfOptions,
  type GlyfTheme,
} from "@glyf-data/embed";
import type { GlyfChart as GlyfChartSpec, GlyfClient } from "@glyf-data/client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

export interface GlyfProviderProps extends GlyfOptions {
  children: ReactNode;
  loading?: ReactNode;
  error?: (error: Error) => ReactNode;
}

const GlyfContext = createContext<Glyf | null>(null);

export function GlyfProvider({
  children,
  loading = null,
  error,
  theme,
  ...options
}: GlyfProviderProps) {
  const [glyf, setGlyf] = useState<Glyf | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const { bundleUrl } = options;

  useEffect(() => {
    let cancelled = false;
    setGlyf(null);
    setLoadError(null);
    createGlyf({ ...options, theme })
      .then((next) => {
        if (!cancelled) setGlyf(next);
      })
      .catch((next: Error) => {
        if (!cancelled) setLoadError(next);
      });
    return () => {
      cancelled = true;
    };
    // A new bundle is a new instance; a theme change is applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleUrl]);

  useEffect(() => {
    if (glyf && theme) glyf.setTheme(theme);
  }, [glyf, theme]);

  if (loadError) {
    return error ? <>{error(loadError)}</> : <div role="alert">{loadError.message}</div>;
  }
  if (!glyf) return <>{loading}</>;
  return <GlyfContext.Provider value={glyf}>{children}</GlyfContext.Provider>;
}

export function useGlyf(): Glyf {
  const glyf = useContext(GlyfContext);
  if (!glyf) throw new Error("useGlyf must be used inside GlyfProvider");
  return glyf;
}

export function useGlyfClient(): GlyfClient {
  return useGlyf().client;
}

export function useGlyfChart(name: string): GlyfChartSpec | undefined {
  return useGlyf().chart(name);
}

/** The filters in effect, re-rendering when they change. */
export function useGlyfFilters(): ActiveFilter[] {
  const glyf = useGlyf();
  const snapshot = useRef<{ key: string; value: ActiveFilter[] }>({ key: "", value: [] });
  return useSyncExternalStore(
    (onChange) => glyf.subscribe(onChange),
    () => {
      const value = glyf.activeFilters;
      const key = JSON.stringify(value);
      if (key !== snapshot.current.key) snapshot.current = { key, value };
      return snapshot.current.value;
    },
  );
}

export interface GlyfChartProps {
  name: string;
  height?: number;
  /** Keep the chart's own title inside the drawing. */
  showTitle?: boolean;
  /** Colours for this chart's series, overriding the provider's palette. */
  palette?: string[];
  className?: string;
  style?: CSSProperties;
  /** Called as the chart's state changes: loading, ready, unfiltered, empty, error. */
  onState?: (state: ChartState) => void;
}

export function GlyfChart({
  name,
  height,
  showTitle,
  palette,
  className,
  style,
  onState,
}: GlyfChartProps) {
  const glyf = useGlyf();
  const element = useRef<HTMLDivElement>(null);
  const stateCallback = useRef(onState);
  stateCallback.current = onState;

  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const handle = glyf.mount(node, name, { height, showTitle, palette });
    // The embed core records its state on the element; follow it there.
    const observer = new MutationObserver(() => stateCallback.current?.(handle.state));
    observer.observe(node, { attributes: true, attributeFilter: ["data-glyf-state"] });
    return () => {
      observer.disconnect();
      handle.destroy();
    };
    // A palette is compared by value, so an inline array does not remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glyf, name, height, showTitle, palette?.join()]);

  return <div ref={element} className={className} style={style} />;
}

export interface GlyfFiltersProps {
  /** The dashboard whose filters to draw, as named in its YAML. */
  dashboard: string;
  className?: string;
}

export function GlyfFilters({ dashboard, className }: GlyfFiltersProps) {
  const glyf = useGlyf();
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!element.current) return;
    const handle = glyf.mountFilters(element.current, dashboard);
    return () => handle.destroy();
  }, [glyf, dashboard]);

  return <div ref={element} className={className} />;
}

export type { ActiveFilter, ChartState, Glyf, GlyfTheme };
export type { GlyfBundle, GlyfChartArtifacts, GlyfDashboard } from "@glyf-data/client";
export type { GlyfChartSpec };
