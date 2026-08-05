interface NotificationPreferences {
  notifyNewBooking: boolean;
  notifyCancellation: boolean;
  notifyLowFillRateWarning: boolean;
}

interface NotificationPreferencesCardProps {
  preferences: NotificationPreferences;
  onChange: (key: keyof NotificationPreferences, value: boolean) => void;
  isSaving: boolean;
}

const ROWS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "notifyNewBooking", label: "New booking" },
  { key: "notifyCancellation", label: "Cancellation" },
  { key: "notifyLowFillRateWarning", label: "Low fill rate warning (3 days before, <50% booked)" },
];

export function NotificationPreferencesCard({ preferences, onChange, isSaving }: NotificationPreferencesCardProps) {
  return (
    <div className="card card-pad">
      <div className="card-title" style={{ marginBottom: 12 }}>
        Notification Preferences
      </div>
      <div className="notification-pref-rows">
        {ROWS.map(({ key, label }) => (
          <label key={key} className="notification-pref-row">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={preferences[key]}
              onChange={(e) => onChange(key, e.target.checked)}
              disabled={isSaving}
            />
          </label>
        ))}
      </div>
      <p className="notification-pref-caption">
        Sent to this account&apos;s email. WhatsApp delivery once the WhatsApp integration extends to
        restaurant-side notifications, not yet built.
      </p>
    </div>
  );
}
