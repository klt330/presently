import { Friend } from '@/lib/types';
import { COMMON_TIMEZONES } from '@/lib/date-utils';

export function FriendForm({
  friend,
  action,
  submitLabel,
}: {
  friend?: Friend;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Name</label>
        <input
          name="name"
          required
          defaultValue={friend?.name}
          placeholder="Jamie Chen"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Birthday</label>
          <input
            type="date"
            name="birthday"
            required
            defaultValue={friend?.birthday}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div className="flex items-end pb-2.5">
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              name="birth_year_known"
              defaultChecked={friend?.birth_year_known ?? true}
              className="rounded focus-ring"
            />
            I know their birth year
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Timezone / region</label>
        <select
          name="timezone"
          defaultValue={friend?.timezone ?? 'America/New_York'}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm bg-white focus-ring"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted mt-1">
          Used to time reminders and birthday wishes to their local day.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">City (optional)</label>
        <input
          name="city"
          defaultValue={friend?.city ?? ''}
          placeholder="Austin, TX"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Mailing address (optional)</label>
        <textarea
          name="address"
          defaultValue={friend?.address ?? ''}
          placeholder="For sending cards or gifts directly"
          rows={2}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm focus-ring"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">
          One or two lines about them
        </label>
        <textarea
          name="bio"
          defaultValue={friend?.bio ?? ''}
          placeholder="Loves cast-iron cooking, vinyl records, and her golden retriever Miso."
          rows={2}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm focus-ring"
        />
        <p className="text-xs text-muted mt-1">
          Used to suggest gift ideas when their wishlist is empty.
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-ribbon text-white text-sm font-medium py-2.5 shadow-pop hover:bg-ribbon-dark transition-colors focus-ring"
      >
        {submitLabel}
      </button>
    </form>
  );
}
