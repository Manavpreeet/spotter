interface Props {
  message?: string;
  submessage?: string;
}

export function MapPreviewLoader({
  message = "Updating route preview…",
  submessage = "Finding locations and drawing your path on the map",
}: Props) {
  return (
    <div className="map-preview-loader card" role="status" aria-live="polite" aria-busy="true">
      <div className="map-preview-loader-inner">
        <div className="loading-ring map-preview-ring" aria-hidden />
        <p className="map-preview-loader-title">{message}</p>
        <p className="map-preview-loader-sub">{submessage}</p>
      </div>
    </div>
  );
}
