<template>
  <section class="status-card growth-calculator-card">
    <div class="section-heading">资源增长计算</div>
    <div class="sync-tip">
      数据会随左侧资源录入和活动周选择实时同步，礼包收益暂按保守值估算。
    </div>

    <div class="summary-grid">
      <div class="summary-panel">
        <div class="summary-title">建议资源</div>
        <div class="summary-list">
          <div v-for="item in summaryItems" :key="`${item.key}-target`" class="summary-row">
            <span class="summary-label">{{ item.label }}</span>
            <strong>{{ formatNumber(item.target) }}</strong>
          </div>
        </div>
      </div>

      <div class="summary-panel">
        <div class="summary-title">预计消耗周前您的资源</div>
        <div class="summary-list">
          <div
            v-for="item in summaryItems"
            :key="`${item.key}-predicted`"
            class="summary-row"
          >
            <span class="summary-label">{{ item.label }}</span>
            <strong>{{ formatNumber(item.predicted) }}</strong>
            <span
              class="summary-delta"
              :class="{ positive: item.delta >= 0, negative: item.delta < 0 }"
            >
              ({{ formatSignedNumber(item.delta) }})
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="resource-tabs">
      <button
        v-for="item in resourceTabs"
        :key="item.key"
        type="button"
        class="resource-tab"
        :class="{ active: selectedResourceKey === item.key }"
        @click="selectedResourceKey = item.key"
      >
        {{ item.label }}
      </button>
    </div>

    <div
      v-if="
        selectedResourceKey !== 'boxPoints' &&
        selectedResourceKey !== 'recruit' &&
        selectedResourceKey !== 'goldRod'
      "
      class="resource-overview"
    >
      <div class="overview-row">
        <span class="overview-label">现有{{ activeResource.label }}</span>
        <strong>{{ formatNumber(activeResource.current) }}</strong>
      </div>
      <div class="overview-row">
        <span class="overview-label">消耗活动前，您的{{ activeResource.label }}</span>
        <strong>{{ formatNumber(activeResource.predicted) }}</strong>
      </div>
      <div class="overview-row total-row">
        <span class="overview-label">{{ activeResource.totalLabel }}</span>
        <strong>{{ formatNumber(activeResource.totalValue) }}</strong>
      </div>
    </div>

    <div v-else-if="selectedResourceKey === 'recruit'" class="resource-overview recruit-resource-overview">
      <div class="recruit-overview-row">
        <span class="overview-label">现有：</span>
        <div class="recruit-overview-value">
          <img :src="RECRUIT_ICON" alt="招募令" class="box-icon small" />
          <strong>{{ formatNumber(activeResource.current) }}</strong>
        </div>
      </div>
      <div class="recruit-overview-row">
        <span class="overview-label">消耗活动前，您的：</span>
        <div class="recruit-overview-value">
          <img :src="RECRUIT_ICON" alt="招募令" class="box-icon small" />
          <strong>{{ formatNumber(activeResource.predicted) }}</strong>
        </div>
      </div>
    </div>

    <div v-else-if="selectedResourceKey === 'goldRod'" class="resource-overview recruit-resource-overview">
      <div class="recruit-overview-row">
        <span class="overview-label">现有：</span>
        <div class="recruit-overview-value">
          <img :src="GOLD_ROD_ICON" alt="黄金鱼竿" class="box-icon small" />
          <strong>{{ formatNumber(activeResource.current) }}</strong>
        </div>
      </div>
      <div class="recruit-overview-row">
        <span class="overview-label">消耗活动前，您的：</span>
        <div class="recruit-overview-value">
          <img :src="GOLD_ROD_ICON" alt="黄金鱼竿" class="box-icon small" />
          <strong>{{ formatNumber(activeResource.predicted) }}</strong>
        </div>
      </div>
    </div>

    <div v-else class="resource-overview box-resource-overview">
      <div class="box-inventory-grid">
        <div v-for="item in boxPointInventoryItems" :key="item.key" class="box-count-chip">
          <img :src="item.icon" :alt="item.label" class="box-icon" />
          <strong>{{ formatNumber(item.count) }}</strong>
        </div>
      </div>
      <div class="box-overview-grid">
        <div class="box-overview-row">
          <span class="overview-label">现有宝箱积分</span>
          <div class="box-round-block">
            <strong>{{ formatNumber(currentResources.boxPoints) }}</strong>
            <small>可做{{ formatDecimal(boxPointCurrentRounds) }}轮</small>
          </div>
        </div>
        <div class="box-overview-row">
          <span class="overview-label">消耗活动前，您的宝箱积分</span>
          <div class="box-round-block">
            <strong>{{ formatNumber(activeResource.predicted) }}</strong>
            <small>可做{{ formatDecimal(boxPointPredictedRounds) }}轮</small>
          </div>
        </div>
        <div class="box-overview-row total-row">
          <span class="overview-label">预计增长</span>
          <strong>{{ formatNumber(activeResource.totalValue) }}</strong>
        </div>
      </div>
    </div>

    <div
      v-if="
        selectedResourceKey !== 'boxPoints' &&
        selectedResourceKey !== 'recruit' &&
        selectedResourceKey !== 'goldRod'
      "
      class="calc-section"
    >
      <div class="calc-section-header">
        <span class="calc-title">每日</span>
        <div class="inline-stat">
          <span>筹备天数</span>
          <strong class="inline-value">{{ formatNumber(derivedSchedule.prepDays) }}</strong>
        </div>
      </div>

      <div :key="`daily-${selectedResourceKey}`" class="field-grid">
        <div v-for="field in activeFieldDefs.daily" :key="field.key" class="field-item">
          <span class="field-label">{{ getFieldLabel(selectedResourceKey, field) }}</span>
          <select
            v-if="isSelectableField(selectedResourceKey, field.key)"
            :value="getSelectableFieldValue(field.key)"
            class="field-select"
            @change="updateSelectableFieldValue(field.key, $event)"
          >
            <option
              v-for="option in getSelectableFieldOptions(field.key)"
              :key="`${field.key}-${option}`"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
          <strong v-else class="field-value">
            {{ formatNumber(getFieldValue(selectedResourceKey, "daily", field.key)) }}
          </strong>
          <span class="field-meta">{{ getFieldMeta(selectedResourceKey, field) }}</span>
        </div>
      </div>

      <div class="calc-total">
        <span>合计</span>
        <strong>{{ formatNumber(activeResource.dailyTotal) }}</strong>
      </div>
    </div>

    <div
      v-if="
        selectedResourceKey !== 'boxPoints' &&
        selectedResourceKey !== 'recruit' &&
        selectedResourceKey !== 'goldRod'
      "
      class="calc-section"
    >
      <div class="calc-section-header weekly-header">
        <span class="calc-title">每周</span>
        <div class="weekly-controls">
          <div class="inline-stat">
            <span>剩余周数</span>
            <strong class="inline-value">{{ formatNumber(derivedSchedule.remainingWeeks) }}</strong>
          </div>
          <div class="inline-stat">
            <span>招募周</span>
            <strong class="inline-value">{{ formatNumber(derivedSchedule.recruitWeeks) }}</strong>
          </div>
          <div class="inline-stat">
            <span>宝箱周</span>
            <strong class="inline-value">{{ formatNumber(derivedSchedule.boxWeeks) }}</strong>
          </div>
          <div class="inline-stat">
            <span>黑市周</span>
            <strong class="inline-value">{{ formatNumber(derivedSchedule.blackMarketWeeks) }}</strong>
          </div>
        </div>
      </div>

      <div class="weekly-note">
        不算本周，当前按剩余 {{ derivedSchedule.remainingWeeks }} 周计算。
      </div>

      <div :key="`weekly-${selectedResourceKey}`" class="field-grid">
        <div v-for="field in activeFieldDefs.weekly" :key="field.key" class="field-item">
          <span class="field-label">{{ getFieldLabel(selectedResourceKey, field) }}</span>
          <select
            v-if="isSelectableField(selectedResourceKey, field.key)"
            :value="getSelectableFieldValue(field.key)"
            class="field-select"
            @change="updateSelectableFieldValue(field.key, $event)"
          >
            <option
              v-for="option in getSelectableFieldOptions(field.key)"
              :key="`${field.key}-${option}`"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
          <strong v-else class="field-value">
            {{ formatNumber(getFieldValue(selectedResourceKey, "weekly", field.key)) }}
          </strong>
          <span class="field-meta">{{ getFieldMeta(selectedResourceKey, field) }}</span>
        </div>
      </div>

      <div class="calc-total">
        <span>合计</span>
        <strong>{{ formatNumber(activeResource.weeklyTotal) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'recruit'" class="calc-section">
      <div class="calc-section-header recruit-section-header">
        <div class="recruit-inline-head">
          <span class="calc-title">每日：</span>
          <strong class="recruit-section-inline">
            {{ formatNumber(derivedSchedule.prepDays) }}天
          </strong>
          <span class="recruit-help-mark" title="按目标活动时间自动计算">?</span>
        </div>
      </div>

      <div class="field-grid recruit-field-grid recruit-detail-grid">
        <div class="recruit-item recruit-input-item">
          <span class="field-inline-text">黑市购买：</span>
          <select
            v-model.number="recruitDailyBlackMarketPurchase"
            class="field-select recruit-count-select"
          >
            <option
              v-for="option in RECRUIT_DAILY_BLACK_MARKET_OPTIONS"
              :key="`recruit-daily-purchase-${option}`"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>
        <label class="recruit-item recruit-input-item editable-item">
          <span class="field-inline-text">购买天数：</span>
          <input
            v-model.number="recruitDailyPurchaseDays"
            :max="recruitDailyPurchaseDaysLimit"
            class="field-input recruit-count-input"
            min="0"
            step="1"
            type="number"
          />
          <span class="recruit-input-meta">最大 {{ formatNumber(recruitDailyPurchaseDaysLimit) }} 天</span>
        </label>
        <div class="recruit-item recruit-full-row">
          <span class="field-label">月卡：</span>
          <strong class="recruit-value">{{ formatNumber(recruitDailySection.monthCardPerDay) }}</strong>
        </div>
      </div>

      <div class="calc-total recruit-calc-total">
        <span>合计：</span>
        <strong>{{ formatNumber(recruitDailySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'recruit'" class="calc-section">
      <div class="calc-section-header weekly-header recruit-section-header">
        <div class="recruit-inline-head">
          <span class="calc-title">每周：</span>
          <span class="weekly-note recruit-weekly-note">{{ recruitWeeklySummaryText }}</span>
          <span class="recruit-help-mark" title="按剩余活动周自动计算">?</span>
        </div>
      </div>

      <div class="field-grid recruit-field-grid recruit-detail-grid">
        <div class="recruit-item">
          <span class="field-label">周一成王：</span>
          <strong class="recruit-value">{{ formatNumber(recruitWeeklySection.kingReward) }}</strong>
        </div>
        <div class="recruit-item">
          <span class="field-label">答题：</span>
          <strong class="recruit-value">{{ formatNumber(recruitWeeklySection.quizReward) }}</strong>
        </div>
        <div class="recruit-item">
          <span class="field-label">招募周：</span>
          <strong class="recruit-value">
            {{ formatNumber(recruitWeeklySection.recruitWeekReward) }}
          </strong>
        </div>
        <div class="recruit-item">
          <span class="field-label">黑市金砖奖励：</span>
          <strong class="recruit-value">
            {{ formatNumber(recruitWeeklySection.blackMarketDiamondReward) }}
          </strong>
        </div>
        <div class="recruit-item">
          <span class="field-label">黑市周购买：</span>
          <strong class="recruit-value">
            {{ formatNumber(recruitWeeklySection.blackMarketPurchasePerWeek) }}
          </strong>
        </div>
        <div class="recruit-item">
          <span class="field-label">怪异塔爬塔：</span>
          <strong class="recruit-value">{{ formatNumber(recruitWeeklySection.weirdTowerReward) }}</strong>
        </div>
      </div>

      <div class="calc-total recruit-calc-total">
        <span>合计：</span>
        <strong>{{ formatNumber(recruitWeeklySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'recruit'" class="calc-section">
      <div class="calc-section-header weekly-header recruit-section-header">
        <div class="recruit-inline-head">
          <span class="calc-title">每月：</span>
          <span class="weekly-note recruit-weekly-note">{{ recruitMonthlySummaryText }}</span>
          <span class="recruit-help-mark" title="按目标活动开始时间自动计算">?</span>
        </div>
      </div>

      <div class="field-grid recruit-field-grid recruit-detail-grid">
        <div class="recruit-item">
          <span class="field-label">成神争霸：</span>
          <strong class="recruit-value">{{ formatNumber(recruitMonthlySection.godBattlePerMonth) }}</strong>
        </div>
        <label class="recruit-item editable-item">
          <span class="field-inline-text">摇桃园：</span>
          <input
            v-model.number="recruitMonthlyPeachGarden"
            class="field-input recruit-count-input"
            min="0"
            step="1"
            type="number"
          />
        </label>
      </div>

      <div class="calc-total recruit-calc-total">
        <span>合计：</span>
        <strong>{{ formatNumber(recruitMonthlySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'goldRod'" class="calc-section">
      <div class="calc-section-header recruit-section-header">
        <div class="recruit-inline-head">
          <span class="calc-title">每日：</span>
          <strong class="recruit-section-inline">
            {{ formatNumber(derivedSchedule.prepDays) }}天
          </strong>
          <span class="recruit-help-mark" title="按目标活动时间自动计算">?</span>
        </div>
      </div>

      <div class="field-grid recruit-field-grid recruit-detail-grid">
        <div class="recruit-item recruit-input-item">
          <span class="field-inline-text">黑市购买：</span>
          <select
            v-model.number="goldRodDailyBlackMarketPurchase"
            class="field-select recruit-count-select"
          >
            <option
              v-for="option in GOLD_ROD_DAILY_BLACK_MARKET_OPTIONS"
              :key="`gold-rod-daily-purchase-${option}`"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>
        <label class="recruit-item recruit-input-item editable-item">
          <span class="field-inline-text">购买天数：</span>
          <input
            v-model.number="goldRodDailyPurchaseDays"
            :max="goldRodDailyPurchaseDaysLimit"
            class="field-input recruit-count-input"
            min="0"
            step="1"
            type="number"
          />
          <span class="recruit-input-meta">最大 {{ formatNumber(goldRodDailyPurchaseDaysLimit) }} 天</span>
        </label>
        <div class="recruit-item recruit-full-row">
          <span class="field-label">月卡：</span>
          <strong class="recruit-value">{{ formatNumber(goldRodDailySection.monthCardPerDay) }}</strong>
        </div>
      </div>

      <div class="calc-total recruit-calc-total">
        <span>合计：</span>
        <strong>{{ formatNumber(goldRodDailySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'goldRod'" class="calc-section">
      <div class="calc-section-header weekly-header recruit-section-header">
        <div class="recruit-inline-head">
          <span class="calc-title">每周：</span>
          <span class="weekly-note recruit-weekly-note">{{ goldRodWeeklySummaryText }}</span>
          <span class="recruit-help-mark" title="按剩余活动周自动计算">?</span>
        </div>
      </div>

      <div class="field-grid recruit-field-grid recruit-detail-grid">
        <div class="recruit-item">
          <span class="field-label">黑市周购买：</span>
          <strong class="recruit-value">
            {{ formatNumber(goldRodWeeklySection.blackMarketPurchasePerWeek) }}
          </strong>
        </div>
        <div class="recruit-item">
          <span class="field-label">黑市周金竿：</span>
          <strong class="recruit-value">
            {{ formatNumber(goldRodWeeklySection.blackMarketRewardPerWeek) }}
          </strong>
        </div>
      </div>

      <div class="calc-total recruit-calc-total">
        <span>合计：</span>
        <strong>{{ formatNumber(goldRodWeeklySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'goldRod'" class="calc-section">
      <div class="calc-section-header weekly-header recruit-section-header">
        <div class="recruit-inline-head">
          <span class="calc-title">每月：</span>
          <span class="weekly-note recruit-weekly-note">{{ goldRodMonthlySummaryText }}</span>
          <span class="recruit-help-mark" title="按目标活动开始时间自动计算">?</span>
        </div>
      </div>

      <div class="field-grid recruit-field-grid recruit-detail-grid">
        <div class="recruit-item">
          <span class="field-label">320普通钓鱼：</span>
          <strong class="recruit-value">{{ formatNumber(goldRodMonthlySection.normalFishingPerMonth) }}</strong>
        </div>
        <label class="recruit-item editable-item">
          <span class="field-inline-text">客厅未领金鱼竿：</span>
          <input
            v-model.number="goldRodMonthlyLivingRoomUnclaimed"
            class="field-input recruit-count-input"
            min="0"
            step="1"
            type="number"
          />
        </label>
      </div>

      <div class="calc-total recruit-calc-total">
        <span>合计：</span>
        <strong>{{ formatNumber(goldRodMonthlySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'goldRod'" class="calc-section">
      <div class="calc-section-header weekly-header recruit-section-header">
        <div class="recruit-inline-head">
          <span class="calc-title">其它：</span>
          <span class="recruit-help-mark" title="按左侧勾选自动计算">?</span>
        </div>
      </div>

      <div class="field-grid recruit-field-grid recruit-detail-grid">
        <div class="recruit-item">
          <span class="field-label">福卡：</span>
          <strong class="recruit-value">{{ formatNumber(goldRodOtherSection.holidayCardValue) }}</strong>
        </div>
      </div>

      <div class="calc-total recruit-calc-total">
        <span>合计：</span>
        <strong>{{ formatNumber(goldRodOtherSection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'boxPoints'" class="calc-section">
      <div class="calc-section-header">
        <span class="calc-title">每日</span>
        <div class="inline-stat">
          <span>筹备天数</span>
          <strong class="inline-value">{{ formatNumber(derivedSchedule.prepDays) }}</strong>
        </div>
      </div>

      <div class="field-grid box-field-grid">
        <div class="field-item chest-field">
          <span class="field-label">黑市购买</span>
          <div class="chest-input-row">
            <label v-for="item in boxPointDailySection.blackMarketItems" :key="item.key" class="chest-input-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <input
                v-model.number="item.model.value"
                class="chest-count-input"
                min="0"
                step="1"
                type="number"
              />
            </label>
          </div>
          <span class="field-meta">按天累计</span>
        </div>
        <div class="field-item">
          <span class="field-label">购买天数</span>
          <strong class="field-value">{{ formatNumber(derivedSchedule.prepDays) }}</strong>
          <span class="field-meta">按筹备天数自动同步</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">每日挂机</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointDailySection.hangUpItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">按天累计</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">竞技场挑战</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointDailySection.arenaChallengeItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">按天累计</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">竞技场结算</span>
          <select v-model="boxArenaSettlementKey" class="field-select chest-select">
            <option
              v-for="option in BOX_POINT_ARENA_SETTLEMENT_OPTIONS"
              :key="option.key"
              :value="option.key"
            >
              {{ option.label }}
            </option>
          </select>
          <span class="field-meta">按天累计</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">周卡</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointWeeklySection.weekCardItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">{{ boxPointWeeklySection.weekCardNote }}</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">珍宝阁</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointDailySection.treasureItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">按左侧珍宝阁勾选按天累计</span>
        </div>
      </div>

      <div class="calc-total">
        <span>合计</span>
        <strong>{{ formatNumber(boxPointDailySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'boxPoints'" class="calc-section">
      <div class="calc-section-header weekly-header">
        <span class="calc-title">每周</span>
      </div>

      <div class="weekly-note">
        不算本周，还剩{{ derivedSchedule.remainingWeeks }}周({{
          derivedSchedule.recruitWeeks
        }}招募，{{ derivedSchedule.boxWeeks }}宝箱，{{
          derivedSchedule.blackMarketWeeks
        }}黑市)
      </div>

      <div class="field-grid box-field-grid">
        <div class="field-item chest-field">
          <span class="field-label">周四成王</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointEventWeeklySection.kingItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">按周累计</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">每周答题</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointEventWeeklySection.quizItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">按周累计</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">宝箱周领取</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointEventWeeklySection.boxWeekGiftItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">仅宝箱周累计</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">黑市周购买</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointEventWeeklySection.blackMarketPurchaseItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">仅黑市周累计</span>
        </div>
        <div class="field-item chest-field">
          <span class="field-label">怪异塔奖励</span>
          <div class="chest-value-row">
            <div v-for="item in boxPointEventWeeklySection.weirdTowerItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">公式待补充，暂记 0</span>
        </div>
        <div class="field-item chest-field">
          <div class="field-inline-head">
            <span class="field-label">竞技场周结算</span>
            <select v-model="boxArenaWeeklySettlementKey" class="field-select chest-select">
              <option
                v-for="option in BOX_POINT_ARENA_WEEKLY_SETTLEMENT_OPTIONS"
                :key="option.key"
                :value="option.key"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="chest-value-row">
            <div v-for="item in boxPointEventWeeklySection.arenaWeeklyItems" :key="item.key" class="chest-value-item">
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">按周累计</span>
        </div>
      </div>

      <div class="calc-total">
        <span>宝箱合计</span>
        <strong>{{ formatNumber(boxPointEventWeeklySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'boxPoints'" class="calc-section">
      <div class="calc-section-header weekly-header">
        <span class="calc-title">每月</span>
      </div>

      <div class="weekly-note">
        不计算本月，还剩{{ boxPointMonthlySection.remainingMonths }}月
      </div>

      <div class="field-grid box-single-grid">
        <div class="field-item chest-field">
          <span class="field-label">320次普通钓鱼</span>
          <div class="chest-value-row">
            <div
              v-for="item in boxPointMonthlySection.normalFishingItems"
              :key="item.key"
              class="chest-value-item"
            >
              <img :src="item.icon" :alt="item.label" class="box-icon small" />
              <strong>{{ formatNumber(item.count) }}</strong>
            </div>
          </div>
          <span class="field-meta">按月估算</span>
        </div>
      </div>

      <div class="calc-total">
        <span>合计</span>
        <strong>{{ formatNumber(boxPointMonthlySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'boxPoints'" class="calc-section">
      <div class="calc-section-header weekly-header">
        <span class="calc-title">活动周</span>
        <div class="inline-stat">
          <span>还剩{{ formatNumber(boxPointActivitySection.remainingBoxWeeks) }}宝箱周</span>
        </div>
      </div>

      <div class="field-grid activity-week-grid">
        <div class="activity-progress-row">
          <span class="field-label activity-progress-label">预计完成宝箱周任务：</span>
          <div class="activity-progress-inline">
            <select
              :value="boxPointActivitySection.predictedTaskRounds"
              class="field-select activity-round-select"
              @change="updateBoxWeekTaskRounds($event)"
            >
              <option
                v-for="option in boxWeekTaskRoundOptions"
                :key="`box-week-round-${option}`"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
            <span class="activity-progress-text">轮</span>
            <span class="activity-progress-divider">/</span>
            <span class="activity-progress-limit">
              {{ formatNumber(boxPointActivitySection.maxTaskRounds) }}轮
            </span>
          </div>
        </div>
        <div class="activity-reward-item">
          <span class="field-label activity-reward-label">额外获得：</span>
          <div class="activity-reward">
            <strong class="activity-reward-value">
              {{ formatNumber(boxPointActivitySection.totalReward) }}
            </strong>
            <span class="activity-reward-unit">金砖</span>
          </div>
        </div>
      </div>

      <div class="activity-note">
        <div class="activity-note-title">说明</div>
        <div class="activity-note-text">
          宝箱周每完成一轮任务，将会使用3440宝箱积分，额外获得7500金砖和16个钻石宝箱。
          按每个钻石宝箱平均350金砖估算，合计平均可获得13000+金砖。
        </div>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'diamond'" class="calc-section">
      <div class="calc-section-header">
        <span class="calc-title">每月</span>
        <div class="inline-stat">
          <span>剩余月数</span>
          <strong class="inline-value">
            {{ formatNumber(diamondMonthlySection.remainingMonths) }}
          </strong>
        </div>
      </div>

      <div class="weekly-note">
        不计算本月，还剩 {{ diamondMonthlySection.remainingMonths }} 月。
      </div>

      <div class="field-grid">
        <div
          v-for="field in diamondMonthlySection.fields"
          :key="field.key"
          class="field-item"
        >
          <span class="field-label">{{ field.label }}</span>
          <strong class="field-value">{{ formatNumber(field.value) }}</strong>
          <span class="field-meta">{{ field.description }}</span>
        </div>
      </div>

      <div class="calc-total">
        <span>合计</span>
        <strong>{{ formatNumber(diamondMonthlySection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'diamond'" class="calc-section">
      <div class="calc-section-header">
        <span class="calc-title">其他</span>
      </div>

      <div class="other-grid">
        <div
          v-for="field in diamondOtherSection.fields"
          :key="field.key"
          class="other-item"
        >
          <div class="other-main">
            <span class="field-label">{{ field.label }}</span>
            <strong class="other-count">{{ formatNumber(field.count) }}</strong>
          </div>
          <div v-if="field.estimate != null" class="other-side">
            <span class="other-hint">预估可开金砖</span>
            <strong class="other-estimate">{{ formatNumber(field.estimate) }}</strong>
          </div>
          <span v-else class="field-meta">{{ field.description }}</span>
        </div>
      </div>

      <div class="calc-total">
        <span>合计</span>
        <strong>{{ formatNumber(diamondOtherSection.total) }}</strong>
      </div>
    </div>

    <div v-if="selectedResourceKey === 'diamond'" class="calc-section">
      <div class="calc-section-header">
        <span class="calc-title">消耗</span>
      </div>

      <div class="weekly-note">
        不算本周，还剩 {{ derivedSchedule.remainingWeeks }} 周({{
          derivedSchedule.recruitWeeks
        }} 招募，{{ derivedSchedule.boxWeeks }} 宝箱，{{
          derivedSchedule.blackMarketWeeks
        }} 黑市)
      </div>

      <div class="field-grid">
        <label class="field-item editable-item">
          <span class="field-label">每日购买</span>
          <input
            v-model.number="dailyPurchaseCount"
            class="field-input"
            min="0"
            step="1"
            type="number"
          />
          <span class="field-meta">默认按单个 500 金砖折算</span>
        </label>
        <div class="field-item">
          <span class="field-label">购买天数</span>
          <strong class="field-value">{{ formatNumber(derivedSchedule.prepDays) }}</strong>
          <span class="field-meta">按筹备天数自动同步</span>
        </div>
        <div class="field-item">
          <span class="field-label">每日购买总消耗</span>
          <strong class="field-value">
            {{ formatNumber(diamondConsumptionSection.dailyPurchaseCost) }}
          </strong>
          <span class="field-meta">自动计算每日固定购买（不含招募令日购）</span>
        </div>
        <div class="field-item">
          <span class="field-label">招募令日购总消耗</span>
          <strong class="field-value">
            {{ formatNumber(diamondConsumptionSection.recruitDailyPurchaseCost) }}
          </strong>
          <span class="field-meta">按 10 招募令=2500 金砖 计算</span>
        </div>
        <div class="field-item">
          <span class="field-label">黄金鱼竿日购总消耗</span>
          <strong class="field-value">
            {{ formatNumber(diamondConsumptionSection.goldRodDailyPurchaseCost) }}
          </strong>
          <span class="field-meta">按 5 黄金鱼竿=2000 金砖 计算</span>
        </div>
        <label class="field-item editable-item">
          <span class="field-label">boss挑战</span>
          <select
            v-model.number="bossChallengeCost"
            class="field-select"
          >
            <option
              v-for="option in BOSS_CHALLENGE_OPTIONS"
              :key="`boss-${option.value}`"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <span class="field-meta">按挑战次数选择对应消耗</span>
        </label>
        <div class="field-item">
          <span class="field-label">黑市周购买</span>
          <strong class="field-value">
            {{ formatNumber(diamondConsumptionSection.blackMarketWeeklyCost) }}
          </strong>
          <span class="field-meta field-meta-ellipsis">{{ blackMarketPackageNote }}</span>
        </div>
      </div>

      <div class="package-picker">
        <div class="package-picker-label">请选择黑市购买礼包</div>
        <details class="package-dropdown">
          <summary class="package-trigger">
            <span class="package-trigger-text">{{ blackMarketPackageSummary }}</span>
          </summary>
          <div class="package-menu">
            <label
              v-for="item in BLACK_MARKET_PACKAGE_OPTIONS"
              :key="item.key"
              class="package-option"
            >
              <div class="package-copy">
                <span class="package-title">{{ item.label }}</span>
                <span v-if="item.desc" class="package-desc">{{ item.desc }}</span>
              </div>
              <strong class="package-price">{{ formatNumber(item.cost) }}</strong>
              <input
                :checked="selectedBlackMarketPackageKeys.includes(item.key)"
                class="package-checkbox"
                type="checkbox"
                @change="toggleBlackMarketPackage(item.key)"
              />
              <span
                class="package-indicator"
                :class="{ checked: selectedBlackMarketPackageKeys.includes(item.key) }"
              ></span>
            </label>
          </div>
        </details>
      </div>

      <div class="calc-total">
        <span>合计消耗</span>
        <strong>{{ formatNumber(diamondConsumptionSection.total) }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { useGoldFishCalcState } from "@/composables/useGoldFishCalcState";

const tokenStore = useTokenStore();
const {
  form,
  selectedEntryPreset,
  holidayCycleInfo,
  getCycleInfo,
  nowMs,
  DAY_MS,
  WEEK_MS,
  arenaDailyReward,
  arenaWeeklyReward,
} = useGoldFishCalcState();

const BASE_TARGETS = {
  diamond: 260000,
  boxPoints: 28000,
  recruit: 3100,
};

const BOX_POINT_VALUE_MAP = Object.freeze({
  wood: 1,
  bronze: 10,
  gold: 20,
  platinum: 50,
});

const BOX_POINT_ROUND_POINTS = 3435;

const BOX_ICON_MAP = Object.freeze({
  wood: `${import.meta.env.BASE_URL}box/mzbx.png`,
  bronze: `${import.meta.env.BASE_URL}box/qtbx.png`,
  gold: `${import.meta.env.BASE_URL}box/hjbx.png`,
  platinum: `${import.meta.env.BASE_URL}box/bjbx.png`,
});
const RECRUIT_ICON = `${import.meta.env.BASE_URL}icons/zml.png`;
const GOLD_ROD_ICON = `${import.meta.env.BASE_URL}fish/hjyg.png`;

const BOX_POINT_DAILY_HANGUP_COUNTS = Object.freeze({
  wood: 6,
  bronze: 6,
  gold: 0,
  platinum: 0,
});

const BOX_POINT_DAILY_ARENA_CHALLENGE_COUNTS = Object.freeze({
  wood: 3,
  bronze: 0,
  gold: 0,
  platinum: 0,
});

const BOX_POINT_ARENA_SETTLEMENT_OPTIONS = Object.freeze([
  {
    key: "bronze2",
    label: "2青铜宝箱",
    counts: { wood: 0, bronze: 2, gold: 0, platinum: 0 },
  },
  {
    key: "bronze1",
    label: "1青铜宝箱",
    counts: { wood: 0, bronze: 1, gold: 0, platinum: 0 },
  },
  {
    key: "gold2",
    label: "2黄金宝箱",
    counts: { wood: 0, bronze: 0, gold: 2, platinum: 0 },
  },
  {
    key: "gold1",
    label: "1黄金宝箱",
    counts: { wood: 0, bronze: 0, gold: 1, platinum: 0 },
  },
]);

const BOX_POINT_WEEKLY_KING_COUNTS = Object.freeze({
  wood: 20,
  bronze: 10,
  gold: 1,
  platinum: 0,
});

const BOX_POINT_WEEKLY_QUIZ_COUNTS = Object.freeze({
  wood: 0,
  bronze: 0,
  gold: 1,
  platinum: 1,
});

const BOX_POINT_BOX_WEEK_GIFT_COUNTS = Object.freeze({
  wood: 0,
  bronze: 10,
  gold: 0,
  platinum: 0,
});

const BOX_POINT_MONTHLY_NORMAL_FISHING_COUNTS = Object.freeze({
  wood: 75,
  bronze: 7,
  gold: 4,
  platinum: 2,
});

const BOX_POINT_BLACK_MARKET_PACKAGE_COUNTS = Object.freeze({
  midBlackMarket: {
    wood: 10,
    bronze: 10,
    gold: 10,
    platinum: 10,
  },
});

const BOX_POINT_ARENA_WEEKLY_SETTLEMENT = Object.freeze({
  label: "2黄金宝箱",
  counts: {
    wood: 0,
    bronze: 0,
    gold: 2,
    platinum: 0,
  },
});

const BOX_POINT_ARENA_WEEKLY_SETTLEMENT_OPTIONS = Object.freeze([
  {
    key: "gold2",
    label: "2黄金宝箱",
    counts: { wood: 0, bronze: 0, gold: 2, platinum: 0 },
  },
  {
    key: "gold1",
    label: "1黄金宝箱",
    counts: { wood: 0, bronze: 0, gold: 1, platinum: 0 },
  },
  {
    key: "platinum2",
    label: "2铂金宝箱",
    counts: { wood: 0, bronze: 0, gold: 0, platinum: 2 },
  },
  {
    key: "platinum1",
    label: "1铂金宝箱",
    counts: { wood: 0, bronze: 0, gold: 0, platinum: 1 },
  },
]);

const BOX_WEEK_TASK_POINTS_PER_ROUND = 3440;
const BOX_WEEK_TASK_REWARD_PER_ROUND = 13000;
const BOX_WEEK_TASKS_PER_WEEK = 4;

const RECRUIT_DAILY_MONTH_CARD = 1;
const RECRUIT_WEEKLY_KING_REWARD = 14;
const RECRUIT_WEEKLY_QUIZ_REWARD = 10;
const RECRUIT_WEEKLY_RECRUIT_WEEK_REWARD = 5;
const RECRUIT_WEEKLY_BLACK_MARKET_DIAMOND_REWARD = 5;
const RECRUIT_WEEKLY_WEIRD_TOWER_REWARD = 0;
const RECRUIT_MONTHLY_GOD_BATTLE_REWARD = 20;
const RECRUIT_DAILY_PURCHASE_GROUP_SIZE = 10;
const RECRUIT_DAILY_PURCHASE_GROUP_DIAMOND_COST = 2500;
const RECRUIT_DAILY_BLACK_MARKET_OPTIONS = Object.freeze(
  Array.from({ length: 13 }, (_, index) => index * 10),
);
const RECRUIT_BLACK_MARKET_PACKAGE_COUNTS = Object.freeze({
  recruit5: 5,
  recruit10: 10,
  highBlackMarket: 40,
});
const GOLD_ROD_DAILY_MONTH_CARD = 1;
const GOLD_ROD_WEEKLY_BLACK_MARKET_REWARD = 5;
const GOLD_ROD_MONTHLY_NORMAL_FISH_REWARD = 20;
const GOLD_ROD_OTHER_HOLIDAY_CARD_REWARD = 70;
const GOLD_ROD_DAILY_PURCHASE_GROUP_SIZE = 5;
const GOLD_ROD_DAILY_PURCHASE_GROUP_DIAMOND_COST = 2000;
const GOLD_ROD_DAILY_BLACK_MARKET_OPTIONS = Object.freeze(
  Array.from({ length: 13 }, (_, index) => index * 5),
);
const GOLD_ROD_BLACK_MARKET_PACKAGE_COUNTS = Object.freeze({
  topRodPack: 30,
});

const RESOURCE_ORDER = ["diamond", "boxPoints", "recruit", "goldRod"];

const FIELD_DEFS = {
  diamond: {
    label: "金砖",
    daily: [
      { key: "robotJar", label: "机器人占领罐子", description: "按天累计" },
      { key: "freeBenefit", label: "免费福利", description: "按天累计" },
      { key: "permanentCard", label: "永久卡", description: "按左侧勾选累计" },
      { key: "monthCard", label: "月卡", description: "按左侧勾选累计" },
      { key: "weekCard", label: "周卡", description: "按左侧勾选累计" },
      { key: "giftPack", label: "礼包", description: "按左侧礼包选择累计" },
      { key: "treasureHouse", label: "珍宝阁", description: "按左侧珍宝阁勾选累计" },
      { key: "arenaDaily", label: "竞技场日结算", description: "按天累计" },
      { key: "unclaimedJar", label: "未领取罐子补充", description: "一次性追加" },
    ],
    weekly: [
      { key: "kingTwice", label: "每日成王2次", description: "按周累计" },
      { key: "quizTask", label: "答题+任务钻石", description: "按周累计" },
      { key: "dreamTwice", label: "梦境2次", description: "按周累计" },
      { key: "arenaWeekly", label: "竞技场周结算", description: "按周累计" },
      { key: "blackMarketGift", label: "黑市周赠送", description: "仅黑市周累计" },
    ],
  },
  boxPoints: {
    label: "宝箱分",
    chestLabels: {
      wood: "木质宝箱",
      bronze: "青铜宝箱",
      gold: "黄金宝箱",
      platinum: "铂金宝箱",
    },
    daily: [
      { key: "dailyBoxPoint", label: "日常宝箱分", description: "待补充公式" },
      { key: "treasureBoxPoint", label: "珍宝阁补充", description: "待补充公式" },
      { key: "oneTimeBoxPoint", label: "一次性补充", description: "待补充公式" },
    ],
    weekly: [
      { key: "weeklyBoxPoint", label: "周常宝箱分", description: "待补充公式" },
      { key: "boxWeekGift", label: "宝箱周赠送", description: "待补充公式" },
    ],
  },
  recruit: {
    label: "招募令",
    daily: [
      { key: "dailyRecruit", label: "日常招募令", description: "待补充公式" },
      { key: "oneTimeRecruit", label: "一次性补充", description: "待补充公式" },
    ],
    weekly: [
      { key: "weeklyRecruit", label: "周常招募令", description: "待补充公式" },
      { key: "recruitWeekGift", label: "招募周赠送", description: "待补充公式" },
    ],
  },
  goldRod: {
    label: "黄金鱼竿",
    daily: [
      { key: "dailyGoldRod", label: "日常黄金鱼竿", description: "待补充公式" },
      { key: "oneTimeGoldRod", label: "一次性补充", description: "待补充公式" },
    ],
    weekly: [
      { key: "weeklyGoldRod", label: "周常黄金鱼竿", description: "待补充公式" },
      { key: "blackMarketGoldRod", label: "黑市周赠送", description: "待补充公式" },
    ],
  },
};

const DIAMOND_DAILY_ESTIMATES = Object.freeze({
  robotJar: 1900,
  freeBenefit: 76,
  unclaimedJar: 0,
});

const DIAMOND_WEEKLY_ESTIMATES = Object.freeze({
  kingTwice: 1950,
  quizTask: 700,
  dreamTwice: 500,
  blackMarketGift: 700,
});

const ARENA_DAILY_OPTIONS = Object.freeze([
  50,
  60,
  80,
  100,
  120,
  150,
  160,
  180,
  200,
  240,
  300,
  320,
  400,
  500,
]);

const ARENA_WEEKLY_OPTIONS = Object.freeze([
  500,
  600,
  800,
  1000,
  1200,
  1500,
  1600,
  1800,
  2000,
  2400,
  2500,
  3000,
]);

const DAILY_PURCHASE_UNIT_COST = 500;
const DAILY_BOX_PURCHASE_COST_MAP = Object.freeze({
  bronze: 500,
  gold: 1000,
  platinum: 500,
});
const BOSS_CHALLENGE_OPTIONS = Object.freeze([
  { value: 0, label: "0(前2次挑战免费)" },
  { value: 40, label: "40(第三次挑战)" },
  { value: 120, label: "120(第四次挑战)" },
]);
const DEFAULT_BLACK_MARKET_PACKAGE_KEYS = Object.freeze(["midBlackMarket", "topRodPack"]);
const BLACK_MARKET_PACKAGE_OPTIONS = Object.freeze([
  { key: "shell10", label: "10灵贝礼包", desc: "", cost: 25000, summaryLabel: "10灵贝礼包" },
  { key: "recruit5", label: "5招募 见面礼", desc: "1000精铁", cost: 600, summaryLabel: "5招募礼" },
  { key: "recruit10", label: "10招募 惊喜礼", desc: "200进阶石", cost: 1200, summaryLabel: "10招募礼" },
  { key: "midBlackMarket", label: "中级黑市包", desc: "40箱子", cost: 5000, summaryLabel: "40宝箱" },
  { key: "highBlackMarket", label: "高级黑市包", desc: "40招募 50红碎", cost: 8000, summaryLabel: "高级黑市包" },
  {
    key: "topRodPack",
    label: "顶级鱼竿包",
    desc: "30金鱼竿 30普通鱼竿",
    cost: 12000,
    summaryLabel: "金鱼礼包",
  },
  { key: "seedPack", label: "觅种礼包", desc: "", cost: 20000, summaryLabel: "觅种礼包" },
  { key: "jadePack", label: "白玉黑市包", desc: "", cost: 2000, summaryLabel: "白玉黑市包" },
  { key: "nightmarePack", label: "梦魇礼包", desc: "2000梦魇石", cost: 5000, summaryLabel: "梦魇礼包" },
  { key: "entryPack", label: "初级黑市包", desc: "5000进阶石", cost: 2500, summaryLabel: "初级黑市包" },
]);

const TREASURE_DAILY_DIAMOND = Object.freeze({
  treasure1: 200,
  treasure6: 700,
  treasure18: 1599,
});

const selectedResourceKey = ref("diamond");
const dailyPurchaseCount = ref(1);
const bossChallengeCost = ref(120);
const selectedBlackMarketPackageKeys = ref([...DEFAULT_BLACK_MARKET_PACKAGE_KEYS]);
const boxBlackMarketBronzeCount = ref(0);
const boxBlackMarketGoldCount = ref(0);
const boxBlackMarketPlatinumCount = ref(0);
const boxArenaSettlementKey = ref("bronze2");
const boxArenaWeeklySettlementKey = ref("gold2");
const boxWeekTaskRounds = ref(0);
const recruitDailyBlackMarketPurchase = ref(0);
const recruitDailyPurchaseDays = ref(0);
const recruitDailyPurchaseDaysInitialized = ref(false);
const recruitMonthlyPeachGarden = ref(0);
const goldRodDailyBlackMarketPurchase = ref(0);
const goldRodDailyPurchaseDays = ref(0);
const goldRodDailyPurchaseDaysInitialized = ref(false);
const goldRodMonthlyLivingRoomUnclaimed = ref(0);

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

const getMonthIndex = (date) => {
  return date.getFullYear() * 12 + date.getMonth();
};

const formatNumber = (value) => Number(value || 0).toLocaleString("zh-CN");
const formatDecimal = (value) => Number(value || 0).toFixed(1);
const formatSignedNumber = (value) => {
  const normalized = Number(value || 0);
  return normalized >= 0
    ? normalized.toLocaleString("zh-CN")
    : `-${Math.abs(normalized).toLocaleString("zh-CN")}`;
};

const role = computed(() => tokenStore.gameData?.roleInfo?.role || null);

const currentResources = computed(() => {
  const items = role.value?.items || {};
  const woodChest = getItemCount(items, 2001);
  const bronzeChest = getItemCount(items, 2002);
  const goldChest = getItemCount(items, 2003);
  const platinumChest = getItemCount(items, 2004);
  const diamondChest = getItemCount(items, 2005);

  return {
    diamond: Number(role.value?.diamond || 0),
    boxPoints:
      woodChest * 1 + bronzeChest * 10 + goldChest * 20 + platinumChest * 50,
    recruit: getItemCount(items, 1001),
    goldRod: getItemCount(items, 1012),
    woodChest,
    bronzeChest,
    goldChest,
    platinumChest,
    diamondChest,
  };
});

const targets = computed(() => {
  return {
    diamond: BASE_TARGETS.diamond,
    boxPoints: BASE_TARGETS.boxPoints,
    recruit: BASE_TARGETS.recruit,
    goldRod: Number(selectedEntryPreset.value?.goldRod || 0),
  };
});

const derivedSchedule = computed(() => {
  const targetCycleStart = holidayCycleInfo.value?.cycleStart?.getTime();
  const now = Number(nowMs.value || Date.now());

  if (!targetCycleStart || targetCycleStart <= now) {
    return {
      prepDays: 0,
      remainingWeeks: 0,
      recruitWeeks: 0,
      boxWeeks: 0,
      blackMarketWeeks: 0,
    };
  }

  const prepDays = Math.ceil((targetCycleStart - now) / DAY_MS);
  const currentCycleInfo = getCycleInfo(new Date(now));
  let cursor = currentCycleInfo
    ? currentCycleInfo.cycleStart.getTime() + WEEK_MS
    : targetCycleStart;
  let recruitWeeks = 0;
  let boxWeeks = 0;
  let blackMarketWeeks = 0;

  while (cursor < targetCycleStart) {
    const cycleInfo = getCycleInfo(new Date(cursor));
    if (cycleInfo?.cycleName === "招募周") {
      recruitWeeks += 1;
    } else if (cycleInfo?.cycleName === "宝箱周") {
      boxWeeks += 1;
    } else if (cycleInfo?.cycleName === "黑市周") {
      blackMarketWeeks += 1;
    }
    cursor += WEEK_MS;
  }

  return {
    prepDays,
    remainingWeeks: recruitWeeks + boxWeeks + blackMarketWeeks,
    recruitWeeks,
    boxWeeks,
    blackMarketWeeks,
  };
});

const recruitDailyPurchaseDaysLimit = computed(() => {
  return Math.max(0, Number(derivedSchedule.value.prepDays || 0));
});

watch(
  recruitDailyPurchaseDaysLimit,
  (limit) => {
    if (!recruitDailyPurchaseDaysInitialized.value) {
      recruitDailyPurchaseDays.value = limit;
      recruitDailyPurchaseDaysInitialized.value = true;
      return;
    }

    if (Number(recruitDailyPurchaseDays.value || 0) > limit) {
      recruitDailyPurchaseDays.value = limit;
    }
  },
  { immediate: true },
);

watch(recruitDailyPurchaseDays, (value) => {
  const numeric = Number(value);
  const normalized = Number.isFinite(numeric) ? Math.floor(numeric) : 0;
  const clamped = Math.min(recruitDailyPurchaseDaysLimit.value, Math.max(0, normalized));

  if (clamped !== numeric) {
    recruitDailyPurchaseDays.value = clamped;
  }
});

const goldRodDailyPurchaseDaysLimit = computed(() => {
  return Math.max(0, Number(derivedSchedule.value.prepDays || 0));
});

watch(
  goldRodDailyPurchaseDaysLimit,
  (limit) => {
    if (!goldRodDailyPurchaseDaysInitialized.value) {
      goldRodDailyPurchaseDays.value = limit;
      goldRodDailyPurchaseDaysInitialized.value = true;
      return;
    }

    if (Number(goldRodDailyPurchaseDays.value || 0) > limit) {
      goldRodDailyPurchaseDays.value = limit;
    }
  },
  { immediate: true },
);

watch(goldRodDailyPurchaseDays, (value) => {
  const numeric = Number(value);
  const normalized = Number.isFinite(numeric) ? Math.floor(numeric) : 0;
  const clamped = Math.min(goldRodDailyPurchaseDaysLimit.value, Math.max(0, normalized));

  if (clamped !== numeric) {
    goldRodDailyPurchaseDays.value = clamped;
  }
});

const remainingFullMonths = computed(() => {
  const targetCycleStart = holidayCycleInfo.value?.cycleStart?.getTime();
  const now = Number(nowMs.value || Date.now());

  if (!targetCycleStart || targetCycleStart <= now) {
    return 0;
  }

  const nowDate = new Date(now);
  const targetDate = new Date(targetCycleStart);
  return Math.max(0, getMonthIndex(targetDate) - getMonthIndex(nowDate) - 1);
});

const treasureHouseDiamond = computed(() => {
  return (
    (form.value.treasure1 ? TREASURE_DAILY_DIAMOND.treasure1 : 0) +
    (form.value.treasure6 ? TREASURE_DAILY_DIAMOND.treasure6 : 0) +
    (form.value.treasure18 ? TREASURE_DAILY_DIAMOND.treasure18 : 0)
  );
});

const giftPackDiamond = computed(() => {
  if (form.value.giftPack === "none") return 0;
  return 200;
});

const sumChestPoints = (counts) => {
  return Object.entries(BOX_POINT_VALUE_MAP).reduce((sum, [key, points]) => {
    return sum + Number(counts[key] || 0) * points;
  }, 0);
};

const makeChestItems = (counts, keys = ["wood", "bronze", "gold", "platinum"]) => {
  return keys.map((key) => ({
    key,
    label: FIELD_DEFS.boxPoints.chestLabels[key],
    icon: BOX_ICON_MAP[key],
    count: Number(counts[key] || 0),
  }));
};

const boxPointInventoryItems = computed(() => {
  return makeChestItems(
    {
      wood: currentResources.value.woodChest,
      bronze: currentResources.value.bronzeChest,
      gold: currentResources.value.goldChest,
      platinum: currentResources.value.platinumChest,
    },
    ["wood", "bronze", "gold", "platinum"],
  );
});

const boxPointCurrentRounds = computed(() => {
  return Number(currentResources.value.boxPoints || 0) / BOX_POINT_ROUND_POINTS;
});

const boxPointDailySection = computed(() => {
  const prepDays = Number(derivedSchedule.value.prepDays || 0);
  const blackMarketCounts = {
    wood: 0,
    bronze: Math.max(0, Number(boxBlackMarketBronzeCount.value || 0)),
    gold: Math.max(0, Number(boxBlackMarketGoldCount.value || 0)),
    platinum: Math.max(0, Number(boxBlackMarketPlatinumCount.value || 0)),
  };
  const hangUpCounts = { ...BOX_POINT_DAILY_HANGUP_COUNTS };
  const arenaChallengeCounts = { ...BOX_POINT_DAILY_ARENA_CHALLENGE_COUNTS };
  const arenaSettlementOption =
    BOX_POINT_ARENA_SETTLEMENT_OPTIONS.find((item) => item.key === boxArenaSettlementKey.value) ||
    BOX_POINT_ARENA_SETTLEMENT_OPTIONS[0];
  const arenaSettlementCounts = { ...arenaSettlementOption.counts };
  const treasureCounts = {
    wood: 0,
    bronze: form.value.treasure1 ? 2 : 0,
    gold: form.value.treasure6 ? 2 : 0,
    platinum: form.value.treasure18 ? 2 : 0,
  };

  const dailyPointValue =
    sumChestPoints(blackMarketCounts) +
    sumChestPoints(hangUpCounts) +
    sumChestPoints(arenaChallengeCounts) +
    sumChestPoints(arenaSettlementCounts) +
    sumChestPoints(treasureCounts);

  return {
    blackMarketItems: [
      {
        key: "bronze",
        label: FIELD_DEFS.boxPoints.chestLabels.bronze,
        icon: BOX_ICON_MAP.bronze,
        model: boxBlackMarketBronzeCount,
      },
      {
        key: "gold",
        label: FIELD_DEFS.boxPoints.chestLabels.gold,
        icon: BOX_ICON_MAP.gold,
        model: boxBlackMarketGoldCount,
      },
      {
        key: "platinum",
        label: FIELD_DEFS.boxPoints.chestLabels.platinum,
        icon: BOX_ICON_MAP.platinum,
        model: boxBlackMarketPlatinumCount,
      },
    ],
    hangUpItems: makeChestItems(hangUpCounts, ["wood", "bronze", "gold"]),
    arenaChallengeItems: makeChestItems(arenaChallengeCounts, ["wood"]),
    treasureItems: makeChestItems(treasureCounts, ["bronze", "gold", "platinum"]),
    total: dailyPointValue * prepDays,
  };
});

const boxPointWeeklySection = computed(() => {
  const remainingWeeks = Number(derivedSchedule.value.remainingWeeks || 0);
  const weekCardCounts = form.value.weekCard
    ? {
        wood: 0,
        bronze: 1,
        gold: 0,
        platinum: 0,
      }
    : {
        wood: 0,
        bronze: 0,
        gold: 0,
        platinum: 0,
      };
  const weekCardPointValue = form.value.weekCard ? 12 : 0;
  const weeklyPointValue = weekCardPointValue;

  return {
    weekCardItems: makeChestItems(weekCardCounts, ["bronze"]),
    weekCardNote: form.value.weekCard ? "挂机200%概率翻倍：12分" : "未勾选周卡",
    total: weeklyPointValue * remainingWeeks,
  };
});

const boxPointEventWeeklySection = computed(() => {
  const remainingWeeks = Number(derivedSchedule.value.remainingWeeks || 0);
  const boxWeeks = Number(derivedSchedule.value.boxWeeks || 0);
  const blackMarketWeeks = Number(derivedSchedule.value.blackMarketWeeks || 0);
  const kingCounts = { ...BOX_POINT_WEEKLY_KING_COUNTS };
  const quizCounts = { ...BOX_POINT_WEEKLY_QUIZ_COUNTS };
  const boxWeekGiftCounts = { ...BOX_POINT_BOX_WEEK_GIFT_COUNTS };
  const blackMarketPurchaseCounts = selectedBlackMarketPackages.value.reduce(
    (result, item) => {
      const counts = BOX_POINT_BLACK_MARKET_PACKAGE_COUNTS[item.key];
      if (!counts) return result;

      result.wood += Number(counts.wood || 0);
      result.bronze += Number(counts.bronze || 0);
      result.gold += Number(counts.gold || 0);
      result.platinum += Number(counts.platinum || 0);
      return result;
    },
    {
      wood: 0,
      bronze: 0,
      gold: 0,
      platinum: 0,
    },
  );
  const weirdTowerCounts = {
    wood: 0,
    bronze: 0,
    gold: 0,
    platinum: 0,
  };
  const arenaWeeklyOption =
    BOX_POINT_ARENA_WEEKLY_SETTLEMENT_OPTIONS.find(
      (item) => item.key === boxArenaWeeklySettlementKey.value,
    ) || BOX_POINT_ARENA_WEEKLY_SETTLEMENT_OPTIONS[0];
  const arenaWeeklyCounts = { ...arenaWeeklyOption.counts };
  const weeklyPointValue =
    sumChestPoints(kingCounts) +
    sumChestPoints(quizCounts) +
    sumChestPoints(weirdTowerCounts) +
    sumChestPoints(arenaWeeklyCounts);
  const cyclePointValue =
    sumChestPoints(boxWeekGiftCounts) * boxWeeks +
    sumChestPoints(blackMarketPurchaseCounts) * blackMarketWeeks;

  return {
    kingItems: makeChestItems(kingCounts, ["wood", "bronze", "gold"]),
    quizItems: makeChestItems(quizCounts, ["gold", "platinum"]),
    boxWeekGiftItems: makeChestItems(boxWeekGiftCounts, ["bronze"]),
    blackMarketPurchaseItems: makeChestItems(
      blackMarketPurchaseCounts,
      ["wood", "bronze", "gold", "platinum"],
    ),
    weirdTowerItems: makeChestItems(weirdTowerCounts, ["wood", "bronze", "gold", "platinum"]),
    arenaWeeklyItems: makeChestItems(arenaWeeklyCounts, ["gold", "platinum"]),
    total: weeklyPointValue * remainingWeeks + cyclePointValue,
  };
});

const boxPointMonthlySection = computed(() => {
  const remainingMonths = Number(remainingFullMonths.value || 0);
  const normalFishingCounts = { ...BOX_POINT_MONTHLY_NORMAL_FISHING_COUNTS };
  const normalFishingPointValue = sumChestPoints(normalFishingCounts);

  return {
    remainingMonths,
    normalFishingItems: makeChestItems(normalFishingCounts, ["wood", "bronze", "gold", "platinum"]),
    total: normalFishingPointValue * remainingMonths,
  };
});

const boxPointExtraTotal = computed(() => {
  return Number(boxPointMonthlySection.value.total || 0);
});

const boxPointCombinedTotal = computed(() => {
  return (
    Number(boxPointDailySection.value.total || 0) +
    Number(boxPointWeeklySection.value.total || 0) +
    Number(boxPointEventWeeklySection.value.total || 0) +
    Number(boxPointExtraTotal.value || 0)
  );
});

const boxPointPredictedRounds = computed(() => {
  return Number(boxPointActivitySection.value.remainingPoints || 0) / BOX_POINT_ROUND_POINTS;
});

const boxPointActivitySection = computed(() => {
  const remainingBoxWeeks = Number(derivedSchedule.value.boxWeeks || 0);
  const predictedPointsBeforeTask =
    Number(currentResources.value.boxPoints || 0) +
    Number(boxPointDailySection.value.total || 0) +
    Number(boxPointWeeklySection.value.total || 0) +
    Number(boxPointEventWeeklySection.value.total || 0) +
    Number(boxPointExtraTotal.value || 0);
  const maxTaskRoundsBySchedule = remainingBoxWeeks * BOX_WEEK_TASKS_PER_WEEK;
  const maxTaskRoundsByPoints = Math.floor(
    predictedPointsBeforeTask / BOX_WEEK_TASK_POINTS_PER_ROUND,
  );
  const maxTaskRounds = Math.max(
    0,
    Math.min(maxTaskRoundsBySchedule, maxTaskRoundsByPoints),
  );
  const predictedTaskRounds = Math.min(
    maxTaskRounds,
    Math.max(0, Math.floor(Number(boxWeekTaskRounds.value || 0))),
  );
  const rewardPerRound = BOX_WEEK_TASK_REWARD_PER_ROUND;
  const taskPointCost = predictedTaskRounds * BOX_WEEK_TASK_POINTS_PER_ROUND;
  const remainingPoints = Math.max(0, predictedPointsBeforeTask - taskPointCost);
  const totalReward = predictedTaskRounds * rewardPerRound;

  return {
    remainingBoxWeeks,
    maxTaskRounds,
    predictedTaskRounds,
    predictedPointsBeforeTask,
    taskPointCost,
    remainingPoints,
    rewardPerRound,
    totalReward,
  };
});

const boxWeekTaskRoundOptions = computed(() => {
  return Array.from(
    { length: Number(boxPointActivitySection.value.maxTaskRounds || 0) + 1 },
    (_, index) => index,
  );
});

const derivedInputs = computed(() => {
  return {
    diamond: {
      daily: {
        ...DIAMOND_DAILY_ESTIMATES,
        arenaDaily: Number(arenaDailyReward.value || 80),
        permanentCard: form.value.permanentCard ? 200 : 0,
        monthCard: form.value.monthCard ? 200 : 0,
        weekCard: form.value.weekCard ? 200 : 0,
        giftPack: giftPackDiamond.value,
        treasureHouse: treasureHouseDiamond.value,
      },
      weekly: {
        ...DIAMOND_WEEKLY_ESTIMATES,
        arenaWeekly: Number(arenaWeeklyReward.value || 600),
      },
    },
    boxPoints: {
      daily: {
        dailyBoxPoint: 0,
        treasureBoxPoint: 0,
        oneTimeBoxPoint: 0,
      },
      weekly: {
        weeklyBoxPoint: 0,
        boxWeekGift: 0,
      },
    },
    recruit: {
      daily: {
        dailyRecruit: 0,
        oneTimeRecruit: 0,
      },
      weekly: {
        weeklyRecruit: 0,
        recruitWeekGift: 0,
      },
    },
    goldRod: {
      daily: {
        dailyGoldRod: 0,
        oneTimeGoldRod: 0,
      },
      weekly: {
        weeklyGoldRod: 0,
        blackMarketGoldRod: 0,
      },
    },
  };
});

const diamondMonthlySection = computed(() => {
  const fields = [
    { key: "signin", label: "签到", value: 600, description: "按月累计" },
    { key: "fishing", label: "捕鱼达人", value: 2000, description: "按月估算" },
    { key: "peach", label: "摇桃园", value: 2000, description: "按月估算" },
    { key: "godBattle", label: "成神争霸", value: 1500, description: "按月估算" },
    {
      key: "passCard",
      label: "通行证",
      value: form.value.passCard ? 17000 : 0,
      description: form.value.passCard ? "按左侧通行证勾选" : "未勾选通行证",
    },
  ];

  const monthlyBaseTotal = fields.reduce((total, field) => total + Number(field.value || 0), 0);
  const total = monthlyBaseTotal * Number(remainingFullMonths.value || 0);

  return {
    remainingMonths: remainingFullMonths.value,
    fields,
    total,
  };
});

const diamondOtherSection = computed(() => {
  const diamondChestCount = Number(currentResources.value.diamondChest || 0);
  const carryConsumeCount = Math.floor(Number(targets.value.goldRod || 0) / 20);
  const boxPointDiamondCount = Number(targets.value.boxPoints > 0 ? 1 : 0);
  const holidayCardValue = form.value.holidayCard ? 27720 : 0;

  const fields = [
    {
      key: "diamondChest",
      label: "携带钻石箱",
      count: diamondChestCount,
      estimate: diamondChestCount * 350,
      description: "按当前库存钻石箱估算",
    },
    {
      key: "carryConsume",
      label: "携带福袋",
      count: carryConsumeCount,
      estimate: carryConsumeCount * 200,
      description: "按入场鱼竿档位折算",
    },
    {
      key: "boxPointDiamond",
      label: "宝箱积分领钻石",
      count: boxPointDiamondCount,
      estimate: boxPointDiamondCount * 350,
      description: "按当前箱积分目标估算",
    },
    {
      key: "boxWeekTaskBonus",
      label: "宝箱周任务",
      count: boxPointActivitySection.value.predictedTaskRounds,
      estimate: boxPointActivitySection.value.totalReward,
      description: `预计完成 ${boxPointActivitySection.value.predictedTaskRounds}/${boxPointActivitySection.value.maxTaskRounds} 轮`,
    },
    {
      key: "holidayCard",
      label: "福卡",
      count: holidayCardValue,
      estimate: null,
      description: form.value.holidayCard ? "按左侧节日福卡勾选" : "未勾选节日福卡",
    },
  ];

  const total = fields.reduce((sum, field) => {
    return sum + Number(field.estimate ?? field.count ?? 0);
  }, 0);

  return {
    fields,
    total,
  };
});

const diamondExtraTotal = computed(() => {
  return Number(diamondMonthlySection.value.total || 0) + Number(diamondOtherSection.value.total || 0);
});

const selectedBlackMarketPackages = computed(() => {
  return BLACK_MARKET_PACKAGE_OPTIONS.filter((item) =>
    selectedBlackMarketPackageKeys.value.includes(item.key),
  );
});

const blackMarketPackageSummary = computed(() => {
  if (!selectedBlackMarketPackages.value.length) {
    return "请选择黑市购买礼包";
  }

  return selectedBlackMarketPackages.value
    .map((item) => item.summaryLabel || item.label)
    .join("、");
});

const blackMarketPackageNote = computed(() => {
  if (!selectedBlackMarketPackages.value.length) {
    return "未选择黑市周购买礼包";
  }

  return `已选 ${blackMarketPackageSummary.value}`;
});

const recruitDailySection = computed(() => {
  const prepDays = Number(derivedSchedule.value.prepDays || 0);
  const blackMarketPurchasePerDay = Math.max(0, Number(recruitDailyBlackMarketPurchase.value || 0));
  const purchaseDays = Math.max(
    0,
    Math.min(prepDays, Number(recruitDailyPurchaseDays.value || 0)),
  );
  const monthCardPerDay = form.value.monthCard ? RECRUIT_DAILY_MONTH_CARD : 0;

  return {
    blackMarketPurchasePerDay,
    purchaseDays,
    monthCardPerDay,
    total: blackMarketPurchasePerDay * purchaseDays + monthCardPerDay * prepDays,
  };
});

const recruitWeeklySection = computed(() => {
  const remainingWeeks = Number(derivedSchedule.value.remainingWeeks || 0);
  const recruitWeeks = Number(derivedSchedule.value.recruitWeeks || 0);
  const blackMarketWeeks = Number(derivedSchedule.value.blackMarketWeeks || 0);
  const kingReward = RECRUIT_WEEKLY_KING_REWARD;
  const quizReward = RECRUIT_WEEKLY_QUIZ_REWARD;
  const recruitWeekReward = RECRUIT_WEEKLY_RECRUIT_WEEK_REWARD;
  const blackMarketDiamondReward = RECRUIT_WEEKLY_BLACK_MARKET_DIAMOND_REWARD;
  const weirdTowerReward = RECRUIT_WEEKLY_WEIRD_TOWER_REWARD;
  const blackMarketPurchasePerWeek = selectedBlackMarketPackages.value.reduce((sum, item) => {
    return sum + Number(RECRUIT_BLACK_MARKET_PACKAGE_COUNTS[item.key] || 0);
  }, 0);

  const total =
    kingReward * remainingWeeks +
    quizReward * remainingWeeks +
    recruitWeekReward * recruitWeeks +
    blackMarketDiamondReward * blackMarketWeeks +
    blackMarketPurchasePerWeek * blackMarketWeeks +
    weirdTowerReward * remainingWeeks;

  return {
    kingReward,
    quizReward,
    recruitWeekReward,
    blackMarketDiamondReward,
    blackMarketPurchasePerWeek,
    weirdTowerReward,
    total,
  };
});

const recruitWeeklySummaryText = computed(() => {
  const remainingWeeks = Number(derivedSchedule.value.remainingWeeks || 0);
  const recruitWeeks = Number(derivedSchedule.value.recruitWeeks || 0);
  const boxWeeks = Number(derivedSchedule.value.boxWeeks || 0);
  const blackMarketWeeks = Number(derivedSchedule.value.blackMarketWeeks || 0);

  return `不算本周,还剩${remainingWeeks}周(${recruitWeeks}招募，${boxWeeks}宝箱，${blackMarketWeeks}黑市)`;
});

const recruitMonthlySection = computed(() => {
  const remainingMonths = Number(remainingFullMonths.value || 0);
  const godBattlePerMonth = RECRUIT_MONTHLY_GOD_BATTLE_REWARD;
  const peachGardenPerMonth = Math.max(0, Number(recruitMonthlyPeachGarden.value || 0));

  return {
    remainingMonths,
    godBattlePerMonth,
    peachGardenPerMonth,
    total: (godBattlePerMonth + peachGardenPerMonth) * remainingMonths,
  };
});

const recruitMonthlySummaryText = computed(() => {
  return `不计算本月，还剩${Number(recruitMonthlySection.value.remainingMonths || 0)}月`;
});

const goldRodDailySection = computed(() => {
  const prepDays = Number(derivedSchedule.value.prepDays || 0);
  const blackMarketPurchasePerDay = Math.max(0, Number(goldRodDailyBlackMarketPurchase.value || 0));
  const purchaseDays = Math.max(
    0,
    Math.min(prepDays, Number(goldRodDailyPurchaseDays.value || 0)),
  );
  const monthCardPerDay = form.value.monthCard ? GOLD_ROD_DAILY_MONTH_CARD : 0;

  return {
    blackMarketPurchasePerDay,
    purchaseDays,
    monthCardPerDay,
    total: blackMarketPurchasePerDay * purchaseDays + monthCardPerDay * prepDays,
  };
});

const goldRodWeeklySection = computed(() => {
  const blackMarketWeeks = Number(derivedSchedule.value.blackMarketWeeks || 0);
  const blackMarketPurchasePerWeek = selectedBlackMarketPackages.value.reduce((sum, item) => {
    return sum + Number(GOLD_ROD_BLACK_MARKET_PACKAGE_COUNTS[item.key] || 0);
  }, 0);
  const blackMarketRewardPerWeek = GOLD_ROD_WEEKLY_BLACK_MARKET_REWARD;
  const total = (blackMarketPurchasePerWeek + blackMarketRewardPerWeek) * blackMarketWeeks;

  return {
    blackMarketPurchasePerWeek,
    blackMarketRewardPerWeek,
    total,
  };
});

const goldRodWeeklySummaryText = computed(() => {
  return `不算本周,还剩${Number(derivedSchedule.value.blackMarketWeeks || 0)}黑市周`;
});

const goldRodMonthlySection = computed(() => {
  const remainingMonths = Number(remainingFullMonths.value || 0);
  const normalFishingPerMonth = GOLD_ROD_MONTHLY_NORMAL_FISH_REWARD;
  const livingRoomUnclaimedPerMonth = Math.max(
    0,
    Number(goldRodMonthlyLivingRoomUnclaimed.value || 0),
  );

  return {
    remainingMonths,
    normalFishingPerMonth,
    livingRoomUnclaimedPerMonth,
    total: (normalFishingPerMonth + livingRoomUnclaimedPerMonth) * remainingMonths,
  };
});

const goldRodMonthlySummaryText = computed(() => {
  return `不计算本月，还剩${Number(goldRodMonthlySection.value.remainingMonths || 0)}月`;
});

const goldRodOtherSection = computed(() => {
  const holidayCardValue = form.value.holidayCard ? GOLD_ROD_OTHER_HOLIDAY_CARD_REWARD : 0;
  return {
    holidayCardValue,
    total: holidayCardValue,
  };
});

const dailyAutoPurchaseCost = computed(() => {
  return (
    Math.max(0, Number(boxBlackMarketBronzeCount.value || 0)) * DAILY_BOX_PURCHASE_COST_MAP.bronze +
    Math.max(0, Number(boxBlackMarketGoldCount.value || 0)) * DAILY_BOX_PURCHASE_COST_MAP.gold +
    Math.max(0, Number(boxBlackMarketPlatinumCount.value || 0)) * DAILY_BOX_PURCHASE_COST_MAP.platinum
  );
});

const diamondConsumptionSection = computed(() => {
  const prepDays = Number(derivedSchedule.value.prepDays || 0);
  const blackMarketWeeks = Number(derivedSchedule.value.blackMarketWeeks || 0);
  const manualDailyPurchaseCost =
    Math.max(0, Number(dailyPurchaseCount.value || 0)) * DAILY_PURCHASE_UNIT_COST;
  const recruitDailyPurchaseGroups =
    Math.max(0, Number(recruitDailySection.value.blackMarketPurchasePerDay || 0)) /
    RECRUIT_DAILY_PURCHASE_GROUP_SIZE;
  const recruitDailyPurchaseCost =
    recruitDailyPurchaseGroups *
    RECRUIT_DAILY_PURCHASE_GROUP_DIAMOND_COST *
    Math.max(0, Number(recruitDailySection.value.purchaseDays || 0));
  const goldRodDailyPurchaseGroups =
    Math.max(0, Number(goldRodDailySection.value.blackMarketPurchasePerDay || 0)) /
    GOLD_ROD_DAILY_PURCHASE_GROUP_SIZE;
  const goldRodDailyPurchaseCost =
    goldRodDailyPurchaseGroups *
    GOLD_ROD_DAILY_PURCHASE_GROUP_DIAMOND_COST *
    Math.max(0, Number(goldRodDailySection.value.purchaseDays || 0));
  const dailyPurchaseCost =
    (manualDailyPurchaseCost + Number(dailyAutoPurchaseCost.value || 0)) * prepDays;
  const bossCost = Math.max(0, Number(bossChallengeCost.value || 0));
  const blackMarketWeeklyCost = selectedBlackMarketPackages.value.reduce(
    (sum, item) => sum + Number(item.cost || 0),
    0,
  );

  return {
    prepDays,
    manualDailyPurchaseCost,
    autoDailyPurchaseCost: Number(dailyAutoPurchaseCost.value || 0),
    dailyPurchaseCost,
    recruitDailyPurchaseGroups,
    recruitDailyPurchaseCost,
    goldRodDailyPurchaseGroups,
    goldRodDailyPurchaseCost,
    bossCost,
    blackMarketWeeklyCost,
    total:
      dailyPurchaseCost +
      recruitDailyPurchaseCost +
      goldRodDailyPurchaseCost +
      bossCost * prepDays +
      blackMarketWeeklyCost * blackMarketWeeks,
  };
});

const resourceTabs = computed(() => {
  return RESOURCE_ORDER.map((key) => ({
    key,
    label: FIELD_DEFS[key].label,
  }));
});

const sumFields = (resourceKey, scope) => {
  const fields = FIELD_DEFS[resourceKey][scope];
  const values = derivedInputs.value[resourceKey][scope];

  return fields.reduce((total, field) => {
    const raw = Number(values[field.key] || 0);

    if (scope === "daily") {
      if (field.key === "unclaimedJar" || field.key.startsWith("oneTime")) {
        return total + raw;
      }
      return total + raw * Number(derivedSchedule.value.prepDays || 0);
    }

    if (field.key === "blackMarketGift" || field.key === "blackMarketGoldRod") {
      return total + raw * Number(derivedSchedule.value.blackMarketWeeks || 0);
    }
    if (field.key === "boxWeekGift") {
      return total + raw * Number(derivedSchedule.value.boxWeeks || 0);
    }
    if (field.key === "recruitWeekGift") {
      return total + raw * Number(derivedSchedule.value.recruitWeeks || 0);
    }

    return total + raw * Number(derivedSchedule.value.remainingWeeks || 0);
  }, 0);
};

const growthByResource = computed(() => {
  return RESOURCE_ORDER.reduce((result, key) => {
    const dailyTotal =
      key === "boxPoints"
        ? boxPointDailySection.value.total
        : key === "recruit"
          ? recruitDailySection.value.total
          : key === "goldRod"
            ? Number(goldRodDailySection.value.total || 0)
          : sumFields(key, "daily");
    const weeklyTotal =
      key === "boxPoints"
        ? Number(boxPointWeeklySection.value.total || 0) +
          Number(boxPointEventWeeklySection.value.total || 0)
        : key === "recruit"
          ? Number(recruitWeeklySection.value.total || 0)
          : key === "goldRod"
            ? Number(goldRodWeeklySection.value.total || 0)
        : sumFields(key, "weekly");
    const extraTotal =
      key === "diamond"
        ? diamondExtraTotal.value
        : key === "boxPoints"
          ? boxPointExtraTotal.value
          : key === "recruit"
            ? Number(recruitMonthlySection.value.total || 0)
            : key === "goldRod"
              ? Number(goldRodMonthlySection.value.total || 0) +
                Number(goldRodOtherSection.value.total || 0)
            : 0;
    const consumptionTotal =
      key === "diamond"
        ? diamondConsumptionSection.value.total
        : key === "boxPoints"
          ? Number(boxPointActivitySection.value.taskPointCost || 0)
          : 0;
    const growth = dailyTotal + weeklyTotal + extraTotal;

    result[key] = {
      dailyTotal,
      weeklyTotal,
      extraTotal,
      consumptionTotal,
      growth,
      netGrowth: growth - consumptionTotal,
    };

    return result;
  }, {});
});

const summaryItems = computed(() => {
  return RESOURCE_ORDER.map((key) => {
    const current = Number(currentResources.value[key] || 0);
    const predicted = current + Number(growthByResource.value[key]?.netGrowth || 0);
    const target = Number(targets.value[key] || 0);

    return {
      key,
      label: FIELD_DEFS[key].label,
      current,
      predicted,
      target,
      delta: predicted - target,
    };
  });
});

const activeFieldDefs = computed(() => FIELD_DEFS[selectedResourceKey.value]);

const activeResource = computed(() => {
  const item =
    summaryItems.value.find((entry) => entry.key === selectedResourceKey.value) ||
    summaryItems.value[0];
  const growth = growthByResource.value[selectedResourceKey.value] || {
    dailyTotal: 0,
    weeklyTotal: 0,
    extraTotal: 0,
    consumptionTotal: 0,
    growth: 0,
    netGrowth: 0,
  };

  return {
    ...item,
    dailyTotal: growth.dailyTotal,
    weeklyTotal: growth.weeklyTotal,
    extraTotal: growth.extraTotal,
    consumptionTotal: growth.consumptionTotal,
    growth: growth.growth,
    netGrowth: growth.netGrowth,
    totalLabel:
      selectedResourceKey.value === "diamond" || selectedResourceKey.value === "boxPoints"
        ? "预计净增长"
        : "预计增长",
    totalValue:
      selectedResourceKey.value === "diamond" || selectedResourceKey.value === "boxPoints"
        ? growth.netGrowth
        : growth.growth,
  };
});

const getFieldValue = (resourceKey, scope, fieldKey) => {
  return Number(derivedInputs.value[resourceKey]?.[scope]?.[fieldKey] || 0);
};

const isSelectableField = (resourceKey, fieldKey) => {
  return resourceKey === "diamond" && (fieldKey === "arenaDaily" || fieldKey === "arenaWeekly");
};

const getSelectableFieldOptions = (fieldKey) => {
  if (fieldKey === "arenaDaily") return ARENA_DAILY_OPTIONS;
  if (fieldKey === "arenaWeekly") return ARENA_WEEKLY_OPTIONS;
  return [];
};

const getSelectableFieldValue = (fieldKey) => {
  if (fieldKey === "arenaDaily") return Number(arenaDailyReward.value || 80);
  if (fieldKey === "arenaWeekly") return Number(arenaWeeklyReward.value || 600);
  return 0;
};

const updateSelectableFieldValue = (fieldKey, event) => {
  const nextValue = Number(event?.target?.value || 0);

  if (fieldKey === "arenaDaily") {
    arenaDailyReward.value = nextValue;
    return;
  }

  if (fieldKey === "arenaWeekly") {
    arenaWeeklyReward.value = nextValue;
  }
};

const updateBoxWeekTaskRounds = (event) => {
  boxWeekTaskRounds.value = Math.max(0, Number(event?.target?.value || 0));
};

const toggleBlackMarketPackage = (key) => {
  if (selectedBlackMarketPackageKeys.value.includes(key)) {
    selectedBlackMarketPackageKeys.value = selectedBlackMarketPackageKeys.value.filter(
      (item) => item !== key,
    );
    return;
  }

  selectedBlackMarketPackageKeys.value = [
    ...selectedBlackMarketPackageKeys.value,
    key,
  ];
};

const getFieldLabel = (resourceKey, field) => {
  if (resourceKey === "diamond" && field.key === "giftPack") {
    if (form.value.giftPack === "1yuan") return "1元礼包";
    if (form.value.giftPack === "60yuan") return "60元礼包";
  }

  return field.label;
};

const getFieldMeta = (resourceKey, field) => {
  if (resourceKey === "diamond" && field.key === "giftPack") {
    if (form.value.giftPack === "none") return "未勾选礼包";
    if (form.value.giftPack === "60yuan") return "按左侧 60元礼包保守估算";
    return "按左侧 1元礼包累计";
  }

  return field.description;
};
</script>

<style scoped lang="scss">
.growth-calculator-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 244, 238, 0.98) 100%);
  border: 1px solid rgba(216, 201, 174, 0.85);
  border-radius: 16px;
  box-shadow:
    0 10px 24px rgba(142, 112, 62, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
  padding: 14px;
}

.sync-tip {
  color: #7a6441;
  font-size: 12px;
  line-height: 1.5;
}

.summary-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-panel,
.resource-overview,
.calc-section {
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(220, 205, 178, 0.9);
  border-radius: 12px;
  padding: 10px;
}

.summary-title,
.calc-title {
  color: #4d3b1d;
  font-size: 14px;
  font-weight: 700;
}

.summary-list {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.summary-row {
  align-items: baseline;
  display: grid;
  gap: 8px;
  grid-template-columns: 56px minmax(0, 1fr) auto;
}

.summary-label {
  color: #6d5735;
  font-size: 13px;
}

.summary-row strong {
  color: #2f2413;
  font-size: 15px;
}

.summary-delta {
  font-size: 13px;
  font-weight: 700;
}

.summary-delta.positive {
  color: #2e8b57;
}

.summary-delta.negative {
  color: #c8593c;
}

.resource-tabs {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.resource-tab {
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(210, 190, 152, 0.92);
  border-radius: 10px;
  color: #5d4314;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  min-height: 34px;
  padding: 0 8px;
}

.resource-tab.active {
  background: linear-gradient(180deg, #f4d99b 0%, #e7bd6c 100%);
  border-color: #d59b39;
  color: #4a3511;
}

.resource-overview {
  display: grid;
  gap: 8px;
}

.box-resource-overview {
  gap: 10px;
}

.box-inventory-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.box-count-chip {
  align-items: center;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(220, 205, 178, 0.85);
  border-radius: 12px;
  display: flex;
  gap: 8px;
  min-height: 46px;
  padding: 0 10px;
}

.box-icon {
  display: block;
  flex: 0 0 auto;
  height: 28px;
  object-fit: contain;
  width: 28px;
}

.box-icon.small {
  height: 24px;
  width: 24px;
}

.box-count-chip strong {
  color: #2f2413;
  font-size: 22px;
}

.box-overview-grid {
  display: grid;
  gap: 10px;
}

.box-overview-row {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.box-round-block {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.box-round-block strong {
  color: #2f2413;
  font-size: 22px;
}

.box-round-block small {
  color: #8b734b;
  font-size: 12px;
}

.overview-row {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.overview-label {
  color: #5f4a2c;
  font-size: 14px;
  font-weight: 600;
}

.overview-row strong {
  color: #2f2413;
  font-size: 20px;
}

.recruit-resource-overview {
  gap: 10px;
}

.recruit-overview-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recruit-overview-value {
  align-items: center;
  display: inline-flex;
  gap: 8px;
}

.recruit-overview-value strong {
  color: #2f2413;
  font-size: 20px;
}

.total-row {
  border-top: 1px solid rgba(221, 205, 177, 0.95);
  margin-top: 2px;
  padding-top: 8px;
}

.calc-section {
  display: grid;
  gap: 10px;
}

.calc-section-header {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.weekly-header {
  align-items: flex-start;
}

.weekly-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.inline-stat {
  align-items: center;
  color: #5f4a2c;
  display: inline-flex;
  flex-wrap: wrap;
  font-size: 13px;
  font-weight: 600;
  gap: 8px;
  line-height: 1;
}

.field-grid {
  align-items: start;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.box-field-grid {
  align-items: start;
}

.box-single-grid {
  grid-template-columns: 1fr;
}

.recruit-section-header {
  justify-content: flex-start;
}

.recruit-inline-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recruit-section-inline {
  color: #2f2413;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.recruit-help-mark {
  align-items: center;
  background: #86a7db;
  border-radius: 50%;
  color: #ffffff;
  display: inline-flex;
  font-size: 11px;
  font-weight: 700;
  height: 16px;
  justify-content: center;
  line-height: 1;
  width: 16px;
}

.recruit-field-grid {
  align-items: start;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.recruit-item {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
}

.recruit-input-item {
  align-items: center;
}

.recruit-detail-grid {
  column-gap: 10px;
  row-gap: 8px;
}

.recruit-full-row {
  grid-column: 1 / -1;
}

.recruit-count-input {
  max-width: 120px;
  min-width: 96px;
  width: 120px;
}

.recruit-count-select {
  max-width: 120px;
  min-width: 96px;
  width: 120px;
}

.recruit-value {
  color: #2f2413;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.recruit-input-meta {
  color: #8b734b;
  font-size: 12px;
  line-height: 1.4;
}

.recruit-weekly-note {
  color: #7b6643;
  font-size: 14px;
  line-height: 1.5;
}

.recruit-calc-total {
  justify-content: center;
}

.field-item {
  align-items: center;
  column-gap: 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  row-gap: 2px;
}

.field-label {
  color: #3f321a;
  font-size: 14px;
  font-weight: 600;
}

.field-inline-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-inline-text {
  color: #255ed8;
  font-size: 14px;
  font-weight: 600;
}

.activity-week-grid {
  grid-template-columns: 1fr;
}

.activity-progress-row {
  align-items: center;
  column-gap: 10px;
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
}

.activity-progress-inline {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.activity-progress-label {
  color: #255ed8;
  font-weight: 700;
}

.activity-round-select {
  min-width: 84px;
  width: 84px;
}

.activity-progress-text {
  color: #5f4a2c;
  font-size: 14px;
  font-weight: 600;
}

.activity-progress-divider {
  color: #8b734b;
  font-size: 14px;
  font-weight: 600;
}

.activity-progress-limit {
  color: #2f2413;
  font-size: 15px;
  font-weight: 700;
}

.activity-reward-item {
  align-items: start;
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr;
}

.activity-reward-label {
  color: #3f321a;
}

.activity-reward {
  align-items: baseline;
  display: inline-flex;
  gap: 8px;
}

.activity-reward-value {
  color: #2f2413;
  font-size: 22px;
  font-weight: 800;
}

.activity-reward-unit {
  color: #8b734b;
  font-size: 13px;
  font-weight: 600;
}

.activity-note {
  background: rgba(250, 244, 232, 0.72);
  border: 1px solid rgba(220, 205, 178, 0.78);
  border-radius: 12px;
  display: grid;
  gap: 8px;
  padding: 12px 14px;
}

.activity-note-title {
  color: #3f321a;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.activity-note-text {
  color: #5f4a2c;
  font-size: 13px;
  line-height: 1.65;
}

.inline-value,
.field-value {
  align-items: center;
  background: rgba(250, 244, 232, 0.95);
  border-radius: 8px;
  color: #2f2413;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  min-height: 32px;
  padding: 0 10px;
}

.inline-value {
  display: inline-flex;
  justify-content: center;
  min-width: 84px;
}

.field-value {
  display: inline-flex;
  justify-content: center;
  justify-self: stretch;
}

.field-input {
  background: rgba(250, 244, 232, 0.98);
  border: 1px solid rgba(214, 190, 149, 0.95);
  border-radius: 8px;
  color: #2f2413;
  font-size: 15px;
  font-weight: 700;
  justify-self: stretch;
  min-height: 30px;
  padding: 0 10px;
}

.editable-item {
  align-items: start;
}

.chest-field {
  align-items: start;
  grid-template-columns: 1fr;
}

.chest-input-row,
.chest-value-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 30px;
}

.chest-input-item,
.chest-value-item {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.chest-count-input {
  background: rgba(250, 244, 232, 0.98);
  border: 1px solid rgba(214, 190, 149, 0.95);
  border-radius: 8px;
  color: #2f2413;
  font-size: 15px;
  font-weight: 700;
  height: 30px;
  padding: 0 8px;
  width: 58px;
}

.chest-value-item strong {
  color: #2f2413;
  font-size: 15px;
  font-weight: 800;
}

.field-select {
  appearance: none;
  background-color: rgba(250, 244, 232, 0.98);
  background-image:
    linear-gradient(45deg, transparent 50%, #8a6934 50%),
    linear-gradient(135deg, #8a6934 50%, transparent 50%);
  background-position:
    calc(100% - 16px) calc(50% - 2px),
    calc(100% - 10px) calc(50% - 2px);
  background-repeat: no-repeat;
  background-size: 6px 6px, 6px 6px;
  border: 1px solid rgba(214, 190, 149, 0.95);
  border-radius: 8px;
  color: #2f2413;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  justify-self: stretch;
  min-height: 30px;
  padding-left: 10px;
  padding-right: 28px;
}

.chest-select {
  justify-self: start;
  min-width: 164px;
}

.field-meta {
  color: #8b734b;
  font-size: 12px;
  grid-column: 1 / -1;
}

.field-meta-ellipsis {
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: break-word;
}

.other-grid {
  display: grid;
  gap: 8px;
}

.other-item {
  align-items: center;
  border: 1px solid rgba(220, 205, 178, 0.78);
  border-radius: 12px;
  column-gap: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 8px 10px;
  row-gap: 4px;
}

.other-main,
.other-side {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.other-main {
  min-width: 0;
}

.other-side {
  justify-content: flex-end;
  text-align: right;
}

.other-count,
.other-estimate {
  color: #2f2413;
  font-size: 18px;
  font-weight: 800;
}

.other-hint {
  color: #8b734b;
  font-size: 12px;
}

.weekly-note {
  color: #7b6643;
  font-size: 12px;
  line-height: 1.5;
}

.package-picker {
  display: grid;
  gap: 6px;
}

.package-picker-label {
  color: #9f4828;
  font-size: 12px;
  font-weight: 700;
}

.package-picker-label::before {
  content: "* ";
}

.package-dropdown {
  position: relative;
  width: 100%;
}

.package-trigger {
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(214, 190, 149, 0.95);
  border-radius: 10px;
  color: #4d3b1d;
  cursor: pointer;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  list-style: none;
  min-height: 38px;
  padding: 8px 12px;
  width: 100%;
  box-sizing: border-box;
}

.package-trigger::-webkit-details-marker {
  display: none;
}

.package-trigger::after {
  align-self: center;
  color: #8a6934;
  content: "▾";
  font-size: 14px;
}

.package-dropdown[open] .package-trigger::after {
  content: "▴";
}

.package-trigger-text {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: break-word;
}

.package-menu {
  background: rgba(255, 250, 244, 0.98);
  border: 1px solid rgba(214, 190, 149, 0.95);
  border-radius: 14px;
  box-shadow: 0 14px 28px rgba(92, 65, 24, 0.12);
  display: grid;
  gap: 0;
  margin-top: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
}

.package-option {
  align-items: center;
  column-gap: 12px;
  cursor: pointer;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  padding: 10px 14px;
}

.package-option + .package-option {
  border-top: 1px solid rgba(229, 216, 194, 0.85);
}

.package-copy {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.package-title {
  color: #3f321a;
  font-size: 14px;
  font-weight: 600;
}

.package-desc {
  color: #8b734b;
  font-size: 12px;
}

.package-price {
  color: #2f2413;
  font-size: 15px;
  font-weight: 800;
}

.package-checkbox {
  display: none;
}

.package-indicator {
  border: 1.5px solid rgba(206, 184, 145, 0.95);
  border-radius: 999px;
  height: 20px;
  position: relative;
  width: 20px;
}

.package-indicator.checked {
  background: linear-gradient(180deg, #4f9cff 0%, #2e7df5 100%);
  border-color: #2e7df5;
}

.package-indicator.checked::after {
  color: #fff;
  content: "✓";
  font-size: 12px;
  font-weight: 800;
  left: 50%;
  line-height: 1;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.calc-total {
  align-items: center;
  border-top: 1px solid rgba(221, 205, 177, 0.95);
  color: #5a4528;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding-top: 8px;
}

.calc-total strong {
  color: #2f2413;
  font-size: 18px;
  margin-left: auto;
  text-align: right;
}

html.dark .growth-calculator-card,
html[data-theme="dark"] .growth-calculator-card {
  background:
    linear-gradient(180deg, rgba(39, 33, 22, 0.98) 0%, rgba(26, 22, 18, 0.98) 100%);
  border-color: rgba(110, 90, 54, 0.9);
}

html.dark .summary-panel,
html.dark .resource-overview,
html.dark .calc-section,
html.dark .activity-note,
html[data-theme="dark"] .summary-panel,
html[data-theme="dark"] .resource-overview,
html[data-theme="dark"] .calc-section,
html[data-theme="dark"] .activity-note {
  background: rgba(60, 49, 33, 0.76);
  border-color: rgba(124, 100, 63, 0.92);
}

html.dark .other-item,
html[data-theme="dark"] .other-item {
  border-color: rgba(124, 100, 63, 0.78);
}

html.dark .box-count-chip,
html[data-theme="dark"] .box-count-chip {
  background: rgba(45, 38, 28, 0.8);
  border-color: rgba(124, 100, 63, 0.78);
}

html.dark .summary-title,
html.dark .calc-title,
html.dark .field-label,
html.dark .field-inline-text,
html.dark .activity-reward-value,
html.dark .activity-note-title,
html.dark .overview-label,
html.dark .summary-row strong,
html.dark .overview-row strong,
html.dark .calc-total strong,
html.dark .other-count,
html.dark .other-estimate,
html.dark .box-count-chip strong,
html.dark .box-round-block strong,
html.dark .chest-value-item strong,
html.dark .recruit-value,
html.dark .recruit-overview-value strong,
html.dark .recruit-section-inline,
html[data-theme="dark"] .summary-title,
html[data-theme="dark"] .calc-title,
html[data-theme="dark"] .field-label,
html[data-theme="dark"] .field-inline-text,
html[data-theme="dark"] .activity-reward-value,
html[data-theme="dark"] .activity-note-title,
html[data-theme="dark"] .overview-label,
html[data-theme="dark"] .summary-row strong,
html[data-theme="dark"] .overview-row strong,
html[data-theme="dark"] .calc-total strong,
html[data-theme="dark"] .other-count,
html[data-theme="dark"] .other-estimate,
html[data-theme="dark"] .box-count-chip strong,
html[data-theme="dark"] .box-round-block strong,
html[data-theme="dark"] .chest-value-item strong,
html[data-theme="dark"] .recruit-value,
html[data-theme="dark"] .recruit-overview-value strong,
html[data-theme="dark"] .recruit-section-inline {
  color: #f3ead8;
}

html.dark .summary-label,
html.dark .inline-stat,
html.dark .field-meta,
html.dark .activity-progress-text,
html.dark .activity-progress-divider,
html.dark .activity-reward-label,
html.dark .weekly-note,
html.dark .calc-total,
html.dark .sync-tip,
html.dark .other-hint,
html.dark .activity-note-text,
html.dark .activity-reward-unit,
html.dark .package-desc,
html.dark .box-round-block small,
html[data-theme="dark"] .summary-label,
html[data-theme="dark"] .inline-stat,
html[data-theme="dark"] .field-meta,
html[data-theme="dark"] .activity-progress-text,
html[data-theme="dark"] .activity-progress-divider,
html[data-theme="dark"] .activity-reward-label,
html[data-theme="dark"] .weekly-note,
html[data-theme="dark"] .calc-total,
html[data-theme="dark"] .sync-tip,
html[data-theme="dark"] .other-hint,
html[data-theme="dark"] .activity-note-text,
html[data-theme="dark"] .activity-reward-unit,
html[data-theme="dark"] .package-desc,
html[data-theme="dark"] .box-round-block small {
  color: #d1bc96;
}

html.dark .resource-tab,
html.dark .inline-value,
html.dark .field-value,
html.dark .activity-progress-limit,
html[data-theme="dark"] .resource-tab,
html[data-theme="dark"] .inline-value,
html[data-theme="dark"] .field-value,
html[data-theme="dark"] .activity-progress-limit {
  background: rgba(30, 27, 22, 0.9);
  color: #f4e9d5;
}

html.dark .activity-progress-label,
html[data-theme="dark"] .activity-progress-label {
  color: #7ea8ff;
}

html.dark .recruit-help-mark,
html[data-theme="dark"] .recruit-help-mark {
  background: #4f6f9f;
  color: #e8f1ff;
}

html.dark .field-input,
html.dark .package-trigger,
html.dark .package-menu,
html.dark .chest-count-input,
html[data-theme="dark"] .field-input,
html[data-theme="dark"] .package-trigger,
html[data-theme="dark"] .package-menu,
html[data-theme="dark"] .chest-count-input {
  background: rgba(30, 27, 22, 0.95);
  border-color: rgba(124, 100, 63, 0.92);
  color: #f4e9d5;
}

html.dark .package-title,
html.dark .package-price,
html[data-theme="dark"] .package-title,
html[data-theme="dark"] .package-price {
  color: #f3ead8;
}

html.dark .package-picker-label,
html[data-theme="dark"] .package-picker-label {
  color: #f2a186;
}

html.dark .package-option + .package-option,
html[data-theme="dark"] .package-option + .package-option {
  border-top-color: rgba(124, 100, 63, 0.55);
}

html.dark .package-indicator,
html[data-theme="dark"] .package-indicator {
  border-color: rgba(124, 100, 63, 0.92);
}

html.dark .field-select,
html[data-theme="dark"] .field-select {
  background-color: rgba(30, 27, 22, 0.95);
  border-color: rgba(124, 100, 63, 0.92);
  color: #f4e9d5;
  background-image:
    linear-gradient(45deg, transparent 50%, #d1bc96 50%),
    linear-gradient(135deg, #d1bc96 50%, transparent 50%);
}

html.dark .resource-tab.active,
html[data-theme="dark"] .resource-tab.active {
  background: linear-gradient(180deg, #8f6b2f 0%, #6d4f20 100%);
  border-color: #b88d45;
  color: #fff3d8;
}

@media (max-width: 768px) {
  .growth-calculator-card {
    padding: 12px;
  }

  .summary-grid,
  .resource-tabs,
  .field-grid,
  .box-inventory-grid {
    grid-template-columns: 1fr;
  }

  .calc-section-header,
  .weekly-header,
  .weekly-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .field-item {
    grid-template-columns: 1fr;
  }

  .other-item {
    grid-template-columns: 1fr;
  }

  .other-side {
    justify-content: flex-start;
    text-align: left;
  }

  .box-overview-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .box-round-block {
    align-items: flex-start;
  }

  .recruit-section-inline {
    font-size: 18px;
  }

  .recruit-count-input {
    max-width: 100%;
    width: 100%;
  }

  .recruit-count-select {
    max-width: 100%;
    width: 100%;
  }

  .package-option {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .package-price {
    justify-self: start;
  }

  .package-indicator {
    justify-self: end;
  }
}
</style>
