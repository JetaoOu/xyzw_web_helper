<template>
  <section class="status-card black-market-planner">
    <div class="section-heading">资源录入</div>
    <div class="planner-form">
      <div class="planner-banner">
        <span class="countdown-text">{{ countdownText }}</span>
        <select v-model="selectedHolidayKey" class="season-select">
          <option
            v-for="option in holidayOptions"
            :key="option.key"
            :value="option.key"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <span class="row-label">VIP等级：</span>
        <select v-model.number="form.vipLevel" class="mini-input mini-select">
          <option v-for="level in vipLevelOptions" :key="level" :value="level">
            {{ level }}
          </option>
        </select>
      </div>

      <div class="form-row option-row">
        <label class="mini-check">
          <input v-model="form.permanentCard" type="checkbox" />
          <span>永久卡</span>
        </label>
        <label class="mini-check">
          <input v-model="form.monthCard" type="checkbox" />
          <span>月卡</span>
        </label>
        <label class="mini-check">
          <input v-model="form.weekCard" type="checkbox" />
          <span>周卡</span>
        </label>
      </div>

      <div class="form-row option-row">
        <label class="mini-check">
          <input v-model="form.passCard" type="checkbox" />
          <span>通行证</span>
        </label>
        <label class="mini-check">
          <input v-model="form.holidayCard" type="checkbox" />
          <span>节日福卡</span>
        </label>
      </div>

      <div class="form-row option-row">
        <label class="mini-radio">
          <input
            v-model="form.giftPack"
            name="gift-pack"
            type="radio"
            value="1yuan"
          />
          <span>1元礼包</span>
        </label>
        <label class="mini-radio">
          <input
            v-model="form.giftPack"
            name="gift-pack"
            type="radio"
            value="60yuan"
          />
          <span>60元礼包</span>
        </label>
        <label class="mini-radio">
          <input
            v-model="form.giftPack"
            name="gift-pack"
            type="radio"
            value="none"
          />
          <span>不计礼包</span>
        </label>
      </div>

      <div class="form-row option-row">
        <span class="row-label">怪异塔：</span>
        <input
          v-model.number="form.weirdTowerFloor"
          class="mini-input"
          min="0"
          type="number"
        />
        <span class="suffix-label">层</span>
        <label class="mini-check inline-check">
          <input v-model="form.pass68" type="checkbox" />
          <span>68通行证</span>
        </label>
      </div>

      <div class="form-row option-row">
        <span class="row-label">珍宝阁：</span>
        <label class="mini-check">
          <input
            :checked="form.treasureAll"
            type="checkbox"
            @change="handleTreasureAllChange"
          />
          <span>全买</span>
        </label>
        <label class="mini-check">
          <input v-model="form.treasure1" type="checkbox" />
          <span>1元</span>
        </label>
        <label class="mini-check">
          <input v-model="form.treasure6" type="checkbox" />
          <span>6元</span>
        </label>
        <label class="mini-check">
          <input v-model="form.treasure18" type="checkbox" />
          <span>18元</span>
        </label>
      </div>
    </div>

    <div class="holiday-grid">
      <div class="holiday-item">
        <span class="holiday-label">目标节日</span>
        <strong>{{ selectedHoliday?.label ?? "未选择" }}</strong>
        <small>
          {{ selectedHoliday?.date ? formatDate(selectedHoliday.date) : "暂无日期" }}
        </small>
      </div>
      <div class="holiday-item">
        <span class="holiday-label">活动周次</span>
        <strong>{{ holidayCycleInfo?.cycleName ?? "待确认" }}</strong>
        <small>{{ holidayCycleRangeText }}</small>
      </div>
      <div class="holiday-item">
        <span class="holiday-label">配置分档</span>
        <strong>{{ configurationSignals.tierLabel }}</strong>
        <small>{{ configurationSuggestionLine }}</small>
      </div>
    </div>

    <div class="recommend-panel">
      <div class="recommend-label">量身推荐入场资源：</div>
      <div class="recommend-main">
        <select v-model="selectedEntryPresetKey" class="recommend-select">
          <option
            v-for="option in entryPresetOptions"
            :key="option.key"
            :value="option.key"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="recommend-sub">{{ plan.priorityLine }}</div>
      <div class="recommend-sub muted">{{ boxPointHint }}</div>
    </div>

    <div class="target-grid">
      <div v-for="item in resourceTargets" :key="item.key" class="target-item">
        <span class="target-label">{{ item.label }}</span>
        <strong>{{ formatNumber(item.target) }}</strong>
        <small :class="{ ready: item.ready }">
          当前 {{ formatNumber(item.current) }}
        </small>
        <small :class="{ ready: item.ready }">
          {{ item.ready ? "已达到推荐线" : `还差 ${formatNumber(item.gap)}` }}
        </small>
      </div>
    </div>

  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import { useGoldFishCalcState } from "@/composables/useGoldFishCalcState";

const tokenStore = useTokenStore();
const message = useMessage();
const {
  nowMs,
  form: sharedForm,
  selectedHolidayKey: sharedSelectedHolidayKey,
  selectedEntryPresetKey: sharedSelectedEntryPresetKey,
  updateGoldFishCalcNow,
} = useGoldFishCalcState();
const syncing = ref(false);
let bannerTimer = null;

const selectedToken = computed(() => tokenStore.selectedToken);
const role = computed(() => tokenStore.gameData?.roleInfo?.role || null);
const evoTower = computed(() => tokenStore.gameData?.evoTowerInfo?.evoTower || null);
const lunarFormatter = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
  month: "long",
  day: "numeric",
});
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});
const shortDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "numeric",
  day: "numeric",
});

const getItemCount = (items, id) => {
  const node = items?.[id];
  if (node != null) {
    if (typeof node === "number") return Number(node);
    return Number(node.num ?? node.count ?? node.quantity ?? 0);
  }

  if (items && typeof items === "object") {
    const match = Object.values(items).find(
      (value) => Number(value?.itemId ?? value?.id) === id,
    );
    if (match) {
      return Number(match.num ?? match.count ?? match.quantity ?? 0);
    }
  }

  return 0;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("zh-CN");
const formatDate = (date) => dateFormatter.format(date);
const vipLevelOptions = Array.from({ length: 19 }, (_, index) => index);
const entryPresetOptions = [
  { key: "props1002", label: "1002道具 60%吃鱼", goldRod: 436 },
  { key: "props1026", label: "1026道具 80%吃鱼", goldRod: 571 },
  { key: "props1050", label: "1050道具 100%吃鱼", goldRod: 706 },
];
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

const selectedHolidayKey = ref("");
const selectedEntryPresetKey = ref(entryPresetOptions[0].key);
const holidaySelectionInitialized = ref(false);

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

const currentResources = computed(() => {
  const items = role.value?.items || {};
  const woodChest = getItemCount(items, 2001);
  const bronzeChest = getItemCount(items, 2002);
  const goldChest = getItemCount(items, 2003);
  const platinumChest = getItemCount(items, 2004);
  const diamondChest = getItemCount(items, 2005);

  return {
    diamond: Number(role.value?.diamond || 0),
    goldRod: getItemCount(items, 1012),
    recruit: getItemCount(items, 1001),
    arenaTicket: getItemCount(items, 1007),
    woodChest,
    bronzeChest,
    goldChest,
    platinumChest,
    diamondChest,
    boxPoints:
      woodChest * 1 + bronzeChest * 10 + goldChest * 20 + platinumChest * 50,
  };
});

const currentWeirdTowerFloor = computed(() => {
  const towerId = Number(evoTower.value?.towerId || 0);
  if (towerId <= 0) return 0;
  return Math.floor(towerId / 10) + 1;
});

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

watch(
  form,
  (value) => {
    sharedForm.value = {
      ...sharedForm.value,
      ...value,
    };
  },
  { deep: true, immediate: true },
);

watch(
  selectedHolidayKey,
  (value) => {
    sharedSelectedHolidayKey.value = value;
  },
  { immediate: true },
);

watch(
  selectedEntryPresetKey,
  (value) => {
    sharedSelectedEntryPresetKey.value = value;
  },
  { immediate: true },
);

const syncOverviewData = (silent = false) => {
  if (!role.value) {
    if (!silent) {
      message.warning("当前没有可读取的角色概览数据");
    }
    return;
  }

  form.value.vipLevel = Math.max(0, Math.min(18, Number(role.value?.vip || 0)));
  form.value.weirdTowerFloor = currentWeirdTowerFloor.value;

  if (!silent) {
    message.success("已读取角色与资源概览模块数据");
  }
};

watch(
  () => role.value?.roleId,
  (roleId) => {
    if (roleId) {
      syncOverviewData(true);
    }
  },
  { immediate: true },
);

watch(
  currentWeirdTowerFloor,
  (value) => {
    if (value > 0) {
      form.value.weirdTowerFloor = value;
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

const handleTreasureAllChange = (event) => {
  const checked = event.target.checked;
  form.value.treasureAll = checked;
  form.value.treasure1 = checked;
  form.value.treasure6 = checked;
  form.value.treasure18 = checked;
};

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

const countdownText = computed(() => {
  if (!holidayCycleInfo.value) {
    return "暂无可用节日数据";
  }

  const now = new Date(nowMs.value);
  const startDiff = holidayCycleInfo.value.cycleStart.getTime() - now.getTime();

  if (startDiff > 0) {
    return `离消耗活动（${holidayCycleInfo.value.cycleName}）开始还有 ${Math.ceil(startDiff / DAY_MS)} 天`;
  }

  const endDiff = holidayCycleInfo.value.cycleEnd.getTime() - now.getTime();
  return `消耗活动（${holidayCycleInfo.value.cycleName}）结束还有 ${Math.max(0, Math.ceil(endDiff / DAY_MS))} 天`;
});

const holidayCycleRangeText = computed(() => {
  if (!holidayCycleInfo.value) return "活动周日期待确认";

  const endDate = addDays(holidayCycleInfo.value.cycleEnd, -1);
  return `${shortDateFormatter.format(holidayCycleInfo.value.cycleStart)} - ${shortDateFormatter.format(endDate)}`;
});

const targets = computed(() => {
  return {
    diamond: 260000,
    boxPoints: 26000,
    goldRod: selectedEntryPreset.value.goldRod,
    recruit: 3500,
  };
});

const readiness = computed(() => ({
  diamond: currentResources.value.diamond / Math.max(targets.value.diamond, 1),
  boxPoints:
    currentResources.value.boxPoints / Math.max(targets.value.boxPoints, 1),
  goldRod: currentResources.value.goldRod / Math.max(targets.value.goldRod, 1),
  recruit: currentResources.value.recruit / Math.max(targets.value.recruit, 1),
}));

const configurationSignals = computed(() => {
  let score = Math.min(12, Number(form.value.vipLevel || 0));
  let enabledCount = 0;

  const addFlag = (enabled, weight) => {
    if (!enabled) return;
    score += weight;
    enabledCount += 1;
  };

  addFlag(form.value.permanentCard, 2);
  addFlag(form.value.monthCard, 2);
  addFlag(form.value.weekCard, 1);
  addFlag(form.value.passCard, 2);
  addFlag(form.value.holidayCard, 2);
  addFlag(form.value.pass68, 2);

  if (form.value.giftPack === "1yuan") {
    score += 1;
    enabledCount += 1;
  } else if (form.value.giftPack === "60yuan") {
    score += 3;
    enabledCount += 1;
  }

  if (form.value.treasure1) {
    score += 1;
    enabledCount += 1;
  }
  if (form.value.treasure6) {
    score += 2;
    enabledCount += 1;
  }
  if (form.value.treasure18) {
    score += 3;
    enabledCount += 1;
  }

  if (form.value.weirdTowerFloor >= 200) score += 2;
  else if (form.value.weirdTowerFloor >= 100) score += 1;

  let tierLabel = "保守投入";
  let suggestedPresetKey = entryPresetOptions[0].key;

  if (score >= 18) {
    tierLabel = "高投入";
    suggestedPresetKey = entryPresetOptions[2].key;
  } else if (score >= 10) {
    tierLabel = "中投入";
    suggestedPresetKey = entryPresetOptions[1].key;
  }

  const suggestedPreset =
    entryPresetOptions.find((option) => option.key === suggestedPresetKey) ||
    entryPresetOptions[0];

  return {
    score,
    enabledCount,
    tierLabel,
    suggestedPreset,
  };
});

const configurationSuggestionLine = computed(() => {
  const { suggestedPreset, enabledCount } = configurationSignals.value;

  if (suggestedPreset.key === selectedEntryPresetKey.value) {
    return `已勾选 ${enabledCount} 项配置，当前档位和估算分档一致`;
  }

  return `已勾选 ${enabledCount} 项配置，可重点关注 ${suggestedPreset.label}`;
});

const weakestResource = computed(() => {
  const mapping = [
    { key: "diamond", label: "金砖", value: readiness.value.diamond },
    { key: "boxPoints", label: "宝箱分", value: readiness.value.boxPoints },
    { key: "goldRod", label: "黄金鱼竿", value: readiness.value.goldRod },
    { key: "recruit", label: "招募令", value: readiness.value.recruit },
  ];

  return mapping.sort((left, right) => left.value - right.value)[0];
});

const plan = computed(() => {
  const ratios = Object.values(readiness.value).map((value) => Math.min(value, 1.2));
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100,
      ),
    ),
  );

  let readinessText = "建议继续补资源";
  if (score >= 95) readinessText = "可直接进场";
  else if (score >= 80) readinessText = "接近推荐线";
  else if (score >= 60) readinessText = "建议补短板后进场";

  const priorityLine =
    score >= 95
      ? "当前资源已达到推荐线，可按所选档位直接进场。"
      : `当前短板在${weakestResource.value.label}，建议优先补齐后再冲消耗活动。`;

  return {
    score,
    readinessText,
    priorityLine,
    targets: targets.value,
  };
});

const resourceTargets = computed(() => {
  const mapping = [
    {
      key: "diamond",
      label: "推荐金砖",
      current: currentResources.value.diamond,
      target: plan.value.targets.diamond,
    },
    {
      key: "boxPoints",
      label: "推荐宝箱分",
      current: currentResources.value.boxPoints,
      target: plan.value.targets.boxPoints,
    },
    {
      key: "goldRod",
      label: "推荐黄金鱼竿",
      current: currentResources.value.goldRod,
      target: plan.value.targets.goldRod,
    },
    {
      key: "recruit",
      label: "推荐招募令",
      current: currentResources.value.recruit,
      target: plan.value.targets.recruit,
    },
  ];

  return mapping.map((item) => ({
    ...item,
    gap: Math.max(item.target - item.current, 0),
    ready: item.current >= item.target,
  }));
});

const boxPointHint = computed(() => {
  return `宝箱分按木箱 1、青铜 10、黄金 20、铂金 50 统计，钻石箱 ${formatNumber(currentResources.value.diamondChest)} 个未折算。`;
});

const handleSyncOverview = async (silent = false) => {
  const tokenId = selectedToken.value?.id;
  if (!tokenId) {
    if (!silent) {
      message.warning("请先选择已连接的 Token");
    }
    return;
  }

  syncing.value = true;

  try {
    const [roleResult, towerResult] = await Promise.allSettled([
      tokenStore.sendGetRoleInfo(tokenId),
      tokenStore.sendMessageWithPromise(tokenId, "evotower_getinfo", {}, 8000),
    ]);

    if (towerResult.status === "fulfilled" && towerResult.value) {
      tokenStore.gameData.evoTowerInfo = towerResult.value;
    }

    syncOverviewData(true);

    if (!silent) {
      if (roleResult.status === "rejected" || towerResult.status === "rejected") {
        message.warning("部分概览同步失败，已尽量更新当前数据");
      } else {
        message.success("已同步角色概览与怪异塔信息");
      }
    }
  } catch (error) {
    if (!silent) {
      const detail =
        error && typeof error === "object" && "message" in error
          ? error.message
          : "未知错误";
      message.error(`同步失败：${detail}`);
    }
  } finally {
    syncing.value = false;
  }
};

onMounted(() => {
  updateGoldFishCalcNow(nowMs.value);
  bannerTimer = window.setInterval(() => {
    nowMs.value = Date.now();
    updateGoldFishCalcNow(nowMs.value);
  }, 60 * 60 * 1000);
});

watch(
  () => selectedToken.value?.id,
  (tokenId) => {
    if (!tokenId) return;
    void handleSyncOverview(true);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (bannerTimer) {
    window.clearInterval(bannerTimer);
    bannerTimer = null;
  }
});
</script>

<style scoped lang="scss">
.black-market-planner {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 243, 234, 0.98) 100%);
  border: 1px solid rgba(216, 201, 174, 0.85);
  border-radius: 18px;
  box-shadow:
    0 10px 24px rgba(142, 112, 62, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: unset;
  padding: 16px;
}

.planner-banner {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.season-select {
  appearance: none;
  background: linear-gradient(135deg, #fcf6e7 0%, #f1dfb0 100%);
  background-image:
    linear-gradient(135deg, #fcf6e7 0%, #f1dfb0 100%),
    linear-gradient(45deg, transparent 50%, #7b5f2a 50%),
    linear-gradient(135deg, #7b5f2a 50%, transparent 50%);
  background-position:
    0 0,
    calc(100% - 16px) 50%,
    calc(100% - 11px) 50%;
  background-repeat: no-repeat;
  background-size:
    100% 100%,
    6px 6px,
    6px 6px;
  border: 1px solid #ddc484;
  border-radius: 8px;
  color: #5d4314;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  min-width: 94px;
  padding: 7px 28px 7px 12px;
}

.season-select:focus,
.mini-input:focus,
.recommend-select:focus {
  border-color: #d0893f;
  box-shadow: 0 0 0 3px rgba(233, 162, 75, 0.18);
  outline: none;
}

.countdown-text {
  color: #4b3c21;
  font-size: 13px;
  font-weight: 600;
}

.planner-form {
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(220, 205, 178, 0.9);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 10px;
}

.form-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  min-height: 28px;
}

.row-label,
.suffix-label {
  color: #3f321a;
  font-size: 14px;
  font-weight: 600;
}

.mini-input {
  appearance: textfield;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(204, 188, 161, 0.95);
  border-radius: 8px;
  color: #2b2214;
  font-size: 14px;
  height: 30px;
  padding: 0 10px;
  width: 82px;
}

.option-row {
  column-gap: 16px;
}

.mini-check,
.mini-radio {
  align-items: center;
  color: #372b16;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  gap: 6px;
}

.mini-check input,
.mini-radio input {
  accent-color: #d27d2d;
  cursor: pointer;
  height: 16px;
  margin: 0;
  width: 16px;
}

.inline-check {
  margin-left: auto;
}

.recommend-panel {
  background: linear-gradient(135deg, rgba(245, 238, 224, 0.95), rgba(239, 227, 198, 0.95));
  border: 1px solid rgba(208, 182, 131, 0.9);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
}

.recommend-label {
  color: #4d3b1d;
  font-size: 13px;
  font-weight: 700;
}

.recommend-main {
  display: flex;
}

.recommend-select {
  appearance: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(244, 231, 201, 0.96)),
    linear-gradient(45deg, transparent 50%, #7b5f2a 50%),
    linear-gradient(135deg, #7b5f2a 50%, transparent 50%);
  background-position:
    0 0,
    calc(100% - 18px) 50%,
    calc(100% - 12px) 50%;
  background-repeat: no-repeat;
  background-size:
    100% 100%,
    6px 6px,
    6px 6px;
  border: 1px solid rgba(204, 176, 121, 0.95);
  border-radius: 10px;
  color: #2f2414;
  cursor: pointer;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  padding: 8px 34px 8px 12px;
  width: 100%;
}

.recommend-sub {
  color: #6c5735;
  font-size: 12px;
  line-height: 1.5;
}

.recommend-sub.muted {
  color: #8a7552;
}

.holiday-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.holiday-item {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(221, 205, 177, 0.95);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 88px;
  padding: 12px;
}

.holiday-label {
  color: #816846;
  font-size: 12px;
}

.holiday-item strong {
  color: #312413;
  font-size: 18px;
  line-height: 1.2;
}

.holiday-item small {
  color: #8f7751;
  font-size: 11px;
  line-height: 1.5;
}

.target-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.target-item {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(221, 205, 177, 0.95);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
}

.target-label {
  color: #816846;
  font-size: 12px;
}

.target-item strong {
  color: #312413;
  font-size: 22px;
  line-height: 1.1;
}

.target-item small {
  color: #9b7d53;
  font-size: 11px;
}

.target-item small.ready {
  color: #2e8b57;
  font-weight: 700;
}

html.dark .black-market-planner,
html[data-theme="dark"] .black-market-planner {
  background:
    linear-gradient(180deg, rgba(39, 33, 22, 0.98) 0%, rgba(26, 22, 18, 0.98) 100%);
  border-color: rgba(110, 90, 54, 0.9);
}

html.dark .row-label,
html.dark .suffix-label,
html.dark .mini-check,
html.dark .mini-radio,
html.dark .countdown-text,
html.dark .target-item strong,
html.dark .holiday-item strong,
html[data-theme="dark"] .row-label,
html[data-theme="dark"] .suffix-label,
html[data-theme="dark"] .mini-check,
html[data-theme="dark"] .mini-radio,
html[data-theme="dark"] .countdown-text,
html[data-theme="dark"] .target-item strong,
html[data-theme="dark"] .holiday-item strong {
  color: #f3ead8;
}

html.dark .recommend-sub,
html.dark .target-label,
html.dark .target-item small,
html.dark .holiday-label,
html.dark .holiday-item small,
html[data-theme="dark"] .recommend-sub,
html[data-theme="dark"] .target-label,
html[data-theme="dark"] .target-item small,
html[data-theme="dark"] .holiday-label,
html[data-theme="dark"] .holiday-item small {
  color: #d1bc96;
}

html.dark .planner-form,
html.dark .recommend-panel,
html.dark .target-item,
html.dark .holiday-item,
html.dark .season-select,
html[data-theme="dark"] .planner-form,
html[data-theme="dark"] .recommend-panel,
html[data-theme="dark"] .target-item,
html[data-theme="dark"] .holiday-item,
html[data-theme="dark"] .season-select {
  background: rgba(60, 49, 33, 0.76);
  border-color: rgba(124, 100, 63, 0.92);
}

html.dark .mini-input,
html[data-theme="dark"] .mini-input {
  background: rgba(30, 27, 22, 0.9);
  border-color: rgba(118, 96, 61, 0.9);
  color: #f4e9d5;
}

html.dark .recommend-select,
html[data-theme="dark"] .recommend-select {
  background:
    linear-gradient(135deg, rgba(72, 58, 38, 0.96), rgba(52, 42, 28, 0.96)),
    linear-gradient(45deg, transparent 50%, #d1bc96 50%),
    linear-gradient(135deg, #d1bc96 50%, transparent 50%);
  border-color: rgba(124, 100, 63, 0.92);
  color: #f3ead8;
}

@media (max-width: 768px) {
  .black-market-planner {
    padding: 14px;
  }

  .holiday-grid,
  .target-grid {
    grid-template-columns: 1fr;
  }
}
</style>
