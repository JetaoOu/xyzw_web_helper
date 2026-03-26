import { computed, ref, watch } from "vue";

const lunarFormatter = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
  month: "long",
  day: "numeric",
});

const nowMs = ref(Date.now());
const vipLevelOptions = Array.from({ length: 19 }, (_, index) => index);
const entryPresetOptions = [
  { key: "props1002", label: "1002道具 60%吃鱼", goldRod: 436 },
  { key: "props1026", label: "1026道具 80%吃鱼", goldRod: 571 },
  { key: "props1050", label: "1050道具 100%吃鱼", goldRod: 706 },
];

const form = ref({
  vipLevel: 0,
  permanentCard: false,
  monthCard: false,
  weekCard: false,
  passCard: false,
  holidayCard: false,
  giftPack: "none",
  weirdTowerFloor: 0,
  pass68: false,
  treasureAll: false,
  treasure1: false,
  treasure6: false,
  treasure18: false,
});

const selectedHolidayKey = ref("");
const selectedEntryPresetKey = ref(entryPresetOptions[0].key);
const arenaDailyReward = ref(80);
const arenaWeeklyReward = ref(600);
const holidaySelectionInitialized = ref(false);

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getLunarMonthDay = (date) => {
  const parts = lunarFormatter.formatToParts(date);
  return {
    month: parts.find((part) => part.type === "month")?.value ?? "",
    day: parts.find((part) => part.type === "day")?.value ?? "",
  };
};

const findNextSolarHoliday = (month, day, fromDate) => {
  const base = startOfDay(fromDate);
  for (let offset = 0; offset <= 8; offset += 1) {
    const year = base.getFullYear() + offset;
    const candidate = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (candidate >= base) return candidate;
  }
  return null;
};

const findNextLunarHoliday = (targetMonth, targetDay, fromDate) => {
  let cursor = startOfDay(fromDate);
  for (let index = 0; index < 366 * 8; index += 1) {
    const lunar = getLunarMonthDay(cursor);
    if (lunar.month === targetMonth && lunar.day === String(targetDay)) {
      const result = new Date(cursor);
      result.setHours(12, 0, 0, 0);
      return result;
    }
    cursor = addDays(cursor, 1);
  }
  return null;
};

const holidayOptions = computed(() => {
  const baseDate = new Date(nowMs.value);
  return [
    {
      key: "duanwu",
      label: "端午节",
      date: findNextLunarHoliday("五月", 5, baseDate),
    },
    {
      key: "zhongqiu",
      label: "中秋节",
      date: findNextLunarHoliday("八月", 15, baseDate),
    },
    {
      key: "yuandan",
      label: "元旦节",
      date: findNextSolarHoliday(1, 1, baseDate),
    },
  ].filter((item) => item.date);
});

watch(
  holidayOptions,
  (options) => {
    if (!options.length) return;

    if (!holidaySelectionInitialized.value) {
      const nearestHoliday = [...options].sort(
        (left, right) => left.date.getTime() - right.date.getTime(),
      )[0];
      selectedHolidayKey.value = nearestHoliday.key;
      holidaySelectionInitialized.value = true;
      return;
    }

    if (!options.some((option) => option.key === selectedHolidayKey.value)) {
      selectedHolidayKey.value = options[0].key;
    }
  },
  { immediate: true },
);

watch(
  () => [form.value.treasure1, form.value.treasure6, form.value.treasure18],
  ([treasure1, treasure6, treasure18]) => {
    form.value.treasureAll = Boolean(treasure1 && treasure6 && treasure18);
  },
);

const selectedHoliday = computed(() => {
  return holidayOptions.value.find(
    (option) => option.key === selectedHolidayKey.value,
  ) || null;
});

const selectedEntryPreset = computed(() => {
  return (
    entryPresetOptions.find((option) => option.key === selectedEntryPresetKey.value) ||
    entryPresetOptions[0]
  );
});

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const ACTIVITY_CYCLE_START = new Date("2025-12-12T12:00:00");
const CYCLE_ORDER = ["黑市周", "招募周", "宝箱周"];

const getCycleInfo = (date) => {
  const targetTime = new Date(date).getTime();
  const elapsed = targetTime - ACTIVITY_CYCLE_START.getTime();
  if (elapsed < 0) return null;

  const weekOffset = Math.floor(elapsed / WEEK_MS);
  const cycleStart = new Date(ACTIVITY_CYCLE_START.getTime() + weekOffset * WEEK_MS);
  const cycleEnd = new Date(cycleStart.getTime() + WEEK_MS);
  const cycleName =
    CYCLE_ORDER[((weekOffset % CYCLE_ORDER.length) + CYCLE_ORDER.length) % CYCLE_ORDER.length];

  return {
    cycleName,
    cycleStart,
    cycleEnd,
  };
};

const holidayCycleInfo = computed(() => {
  if (!selectedHoliday.value?.date) return null;

  const cycleInfo = getCycleInfo(selectedHoliday.value.date);
  if (!cycleInfo) return null;

  return {
    ...cycleInfo,
    holidayDate: new Date(selectedHoliday.value.date),
  };
});

const updateGoldFishCalcNow = (value = Date.now()) => {
  nowMs.value = value;
};

export function useGoldFishCalcState() {
  return {
    nowMs,
    form,
    vipLevelOptions,
    entryPresetOptions,
    selectedHolidayKey,
    selectedEntryPresetKey,
    arenaDailyReward,
    arenaWeeklyReward,
    holidayOptions,
    selectedHoliday,
    selectedEntryPreset,
    holidayCycleInfo,
    updateGoldFishCalcNow,
    DAY_MS,
    WEEK_MS,
    getCycleInfo,
  };
}
