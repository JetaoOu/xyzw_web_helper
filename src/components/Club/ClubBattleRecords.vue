<template>
  <div class="battle-records-wrapper">
    <!-- Inline 模式：卡片渲染 -->
    <div v-if="inline" class="inline-container">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <h1 class="main-title">俱乐部盐场战绩</h1>
        <div class="operation-group">
          <!-- 日期选择 + 刷新 -->
          <div class="operation-item">
            <a-date-picker
                v-model:value="queryDate"
                @change="fetchBattleRecordsByDate"
                valueFormat="YYYY/MM/DD"
                :disabled-date="disabledDate"
                class="date-picker"
            />
            <n-button size="small" :disabled="loading" @click="handleRefresh" class="refresh-btn">
              <template #icon><n-icon><Refresh /></n-icon></template>
              刷新
            </n-button>
          </div>
          <!-- 导出相关 -->
          <div class="operation-item">
            <n-checkbox-group v-model:value="exportmethod" name="group-exportmethod" size="small">
              <n-checkbox value="1">表格导出</n-checkbox>
              <n-checkbox value="2">图片导出</n-checkbox>
            </n-checkbox-group>
            <n-button type="primary" size="small" :disabled="!battleRecords || loading" @click="handleExport" class="export-btn">
              <template #icon><n-icon><Copy /></n-icon></template>
              导出
            </n-button>
          </div>
        </div>
      </div>

      <!-- 内容区域 - 左右布局：战神榜在左，数据模块在右 -->
      <div class="content-wrapper" ref="exportDom">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <n-spin size="large">
            <template #description>正在加载战绩数据...</template>
          </n-spin>
        </div>

        <!-- 战绩列表 -->
        <div v-else-if="battleRecords && battleRecords.roleDetailsList" class="records-container">
          <!-- 日期和俱乐部标题 -->
          <div class="title-banner">
            <span class="date-text">{{ queryDate }}</span>
            <span class="club-text">{{ club.name || '俱乐部' }}盐场战绩</span>
          </div>

          <!-- 主内容左右布局 -->
          <div class="main-content-layout">
            <!-- 左边：战神榜 -->
            <div class="left-section">
              <div class="god-ranking-section">
                <div class="god-ranking-header">俱乐部战神榜</div>
                <div class="god-ranking-table">
                  <div class="table-header">
                    <div class="table-col rank-col">排名</div>
                    <div class="table-col avatar-col">头像</div>
                    <div class="table-col name-col">玩家</div>
                    <div class="table-col stat-col">击杀</div>
                    <div class="table-col stat-col">死亡</div>
                    <div class="table-col stat-col">攻城</div>
                    <div class="table-col stat-col">复活</div>
                    <div class="table-col stat-col">K/D</div>
                  </div>
                  <div class="table-body">
                    <div v-for="(player, index) in battleRecords.roleDetailsList" :key="player.roleId" class="table-row" :class="`row-${index+1}`">
                      <div class="table-col rank-col">
                        <div class="row-rank-badge">{{ index + 1 }}</div>
                      </div>
                      <div class="table-col avatar-col">
                        <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="row-avatar" @error="handleImageError">
                        <div v-else class="row-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                      </div>
                      <div class="table-col name-col">{{ player.name }}</div>
                      <div class="table-col stat-col">{{ player.winCnt || 0 }}</div>
                      <div class="table-col stat-col">{{ player.loseCnt || 0 }}</div>
                      <div class="table-col stat-col">{{ player.buildingCnt || 0 }}</div>
                      <div class="table-col stat-col">{{ Math.max(player.loseCnt - 6, 0) || 0 }}</div>
                      <div class="table-col stat-col">{{ parseFloat((player.winCnt && player.loseCnt ? player.winCnt/player.loseCnt : 0.00)).toFixed(2) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右边：总体数据 + Top3榜单 -->
            <div class="right-section">
              <!-- 总体数据统计 -->
              <div class="summary-stats">
                <div class="summary-title">俱乐部总体数据</div>
                <div class="stats-cards">
                  <div class="stat-card kill-card">
                    <div class="stat-label">总击杀</div>
                    <div class="stat-value">{{ totalKills }}</div>
                  </div>
                  <div class="stat-card revive-card">
                    <div class="stat-label">总复活</div>
                    <div class="stat-value">{{ totalRevives }}</div>
                  </div>
                  <div class="stat-card kd-card">
                    <div class="stat-label">总K/D</div>
                    <div class="stat-value">{{ totalKD }}</div>
                  </div>
                </div>
              </div>

              <!-- Top3榜单区域 -->
              <div class="top-rankings">
                <!-- 击杀榜 -->
                <div class="rank-card">
                  <div class="rank-card-header">击杀榜 Top3</div>
                  <div class="rank-list">
                    <div v-for="(player, index) in killRank" :key="index" class="rank-item" :class="`rank-${index+1}`">
                      <div class="rank-badge">{{ index + 1 }}</div>
                      <div class="player-info">
                        <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="avatar" @error="handleImageError">
                        <div v-else class="avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                        <span class="name">{{ player.name }}</span>
                      </div>
                      <div class="rank-value">{{ player.winCnt || 0 }}</div>
                    </div>
                  </div>
                </div>

                <!-- K/D榜 -->
                <div class="rank-card">
                  <div class="rank-card-header">K/D榜 Top3</div>
                  <div class="rank-list">
                    <div v-for="(player, index) in kdRank" :key="index" class="rank-item" :class="`rank-${index+1}`">
                      <div class="rank-badge">{{ index + 1 }}</div>
                      <div class="player-info">
                        <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="avatar" @error="handleImageError">
                        <div v-else class="avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                        <span class="name">{{ player.name }}</span>
                      </div>
                      <div class="rank-value">{{ player.kd || 0 }}</div>
                    </div>
                  </div>
                </div>

                <!-- 复活榜 -->
                <div class="rank-card">
                  <div class="rank-card-header">复活榜 Top3</div>
                  <div class="rank-list">
                    <div v-for="(player, index) in reviveRank" :key="index" class="rank-item" :class="`rank-${index+1}`">
                      <div class="rank-badge">{{ index + 1 }}</div>
                      <div class="player-info">
                        <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="avatar" @error="handleImageError">
                        <div v-else class="avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                        <span class="name">{{ player.name }}</span>
                      </div>
                      <div class="rank-value">{{ player.reviveCnt || 0 }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-container">
          <n-empty description="暂无战绩数据" size="large">
            <template #icon><n-icon><DocumentText /></n-icon></template>
          </n-empty>
        </div>
      </div>
    </div>

    <!-- Modal 模式 -->
    <n-modal
        v-else
        v-model:show="showModal"
        preset="card"
        title="俱乐部盐场战绩"
        style="width: 95%; max-width: 1400px"
        @after-leave="handleClose"
    >
      <template #header-extra>
        <div class="modal-header-actions">
          <a-date-picker
              v-model:value="queryDate"
              @change="fetchBattleRecordsByDate"
              valueFormat="YYYY/MM/DD"
              :disabled-date="disabledDate"
              class="modal-date-picker"
          />
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon><n-icon><Refresh /></n-icon></template>
            刷新
          </n-button>
          <n-checkbox-group v-model:value="exportmethod" name="group-exportmethod" size="small">
            <n-checkbox value="1">表格导出</n-checkbox>
            <n-checkbox value="2">图片导出</n-checkbox>
          </n-checkbox-group>
          <n-button type="primary" size="small" :disabled="!battleRecords || loading" @click="handleExport">
            <template #icon><n-icon><Copy /></n-icon></template>
            导出
          </n-button>
        </div>
      </template>

      <div class="modal-content" ref="exportDom">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <n-spin size="large">
            <template #description>正在加载战绩数据...</template>
          </n-spin>
        </div>

        <!-- 战绩列表 -->
        <div v-else-if="battleRecords && battleRecords.roleDetailsList" class="modal-records-container">
          <!-- 主内容左右布局 -->
          <div class="main-content-layout">
            <!-- 左边：战神榜 -->
            <div class="left-section">
              <div class="god-ranking-section">
                <div class="god-ranking-header">俱乐部战神榜</div>
                <div class="god-ranking-table">
                  <div class="table-header">
                    <div class="table-col rank-col">排名</div>
                    <div class="table-col avatar-col">头像</div>
                    <div class="table-col name-col">玩家</div>
                    <div class="table-col stat-col">击杀</div>
                    <div class="table-col stat-col">死亡</div>
                    <div class="table-col stat-col">攻城</div>
                    <div class="table-col stat-col">复活</div>
                    <div class="table-col stat-col">K/D</div>
                  </div>
                  <div class="table-body">
                    <div v-for="(player, index) in battleRecords.roleDetailsList" :key="player.roleId" class="table-row" :class="`row-${index+1}`">
                      <div class="table-col rank-col">
                        <div class="row-rank-badge">{{ index + 1 }}</div>
                      </div>
                      <div class="table-col avatar-col">
                        <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="row-avatar" @error="handleImageError">
                        <div v-else class="row-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                      </div>
                      <div class="table-col name-col">{{ player.name }}</div>
                      <div class="table-col stat-col">{{ player.winCnt || 0 }}</div>
                      <div class="table-col stat-col">{{ player.loseCnt || 0 }}</div>
                      <div class="table-col stat-col">{{ player.buildingCnt || 0 }}</div>
                      <div class="table-col stat-col">{{ Math.max(player.loseCnt - 6, 0) || 0 }}</div>
                      <div class="table-col stat-col">{{ parseFloat((player.winCnt && player.loseCnt ? player.winCnt/player.loseCnt : 0.00)).toFixed(2) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右边：总体数据 + Top3榜单 -->
            <div class="right-section">
              <!-- 总体数据统计 -->
              <div class="summary-stats modal-summary">
                <div class="summary-title">俱乐部总体数据</div>
                <div class="stats-cards">
                  <div class="stat-card kill-card">
                    <div class="stat-label">总击杀</div>
                    <div class="stat-value">{{ totalKills }}</div>
                  </div>
                  <div class="stat-card revive-card">
                    <div class="stat-label">总复活</div>
                    <div class="stat-value">{{ totalRevives }}</div>
                  </div>
                  <div class="stat-card kd-card">
                    <div class="stat-label">总K/D</div>
                    <div class="stat-value">{{ totalKD }}</div>
                  </div>
                </div>
              </div>

              <!-- Top3榜单区域 -->
              <div class="top-rankings modal-top-rankings">
                <div class="rank-card">
                  <div class="rank-card-header">击杀榜 Top3</div>
                  <div class="rank-list">
                    <div v-for="(player, index) in killRank" :key="index" class="rank-item" :class="`rank-${index+1}`">
                      <div class="rank-badge">{{ index + 1 }}</div>
                      <div class="player-info">
                        <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="avatar" @error="handleImageError">
                        <div v-else class="avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                        <span class="name">{{ player.name }}</span>
                      </div>
                      <div class="rank-value">{{ player.winCnt || 0 }}</div>
                    </div>
                  </div>
                </div>

                <div class="rank-card">
                  <div class="rank-card-header">K/D榜 Top3</div>
                  <div class="rank-list">
                    <div v-for="(player, index) in kdRank" :key="index" class="rank-item" :class="`rank-${index+1}`">
                      <div class="rank-badge">{{ index + 1 }}</div>
                      <div class="player-info">
                        <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="avatar" @error="handleImageError">
                        <div v-else class="avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                        <span class="name">{{ player.name }}</span>
                      </div>
                      <div class="rank-value">{{ player.kd || 0 }}</div>
                    </div>
                  </div>
                </div>

                <div class="rank-card">
                  <div class="rank-card-header">复活榜 Top3</div>
                  <div class="rank-list">
                    <div v-for="(player, index) in reviveRank" :key="index" class="rank-item" :class="`rank-${index+1}`">
                      <div class="rank-badge">{{ index + 1 }}</div>
                      <div class="player-info">
                        <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="avatar" @error="handleImageError">
                        <div v-else class="avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                        <span class="name">{{ player.name }}</span>
                      </div>
                      <div class="rank-value">{{ player.reviveCnt || 0 }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-container">
          <n-empty description="暂无战绩数据" size="large">
            <template #icon><n-icon><DocumentText /></n-icon></template>
          </n-empty>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessage, NCheckboxGroup, NCheckbox } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import html2canvas from 'html2canvas';
import { Refresh, Copy, DocumentText } from '@vicons/ionicons5'
import { getLastSaturday, formatBattleRecordsForExport, copyToClipboard } from '@/utils/clubBattleUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const exportmethod = ref(['2']);
const exportDom = ref(null);
const emit = defineEmits(['update:visible'])

const message = useMessage()
const tokenStore = useTokenStore()
const info = computed(() => tokenStore.gameData?.legionInfo || null);
const club = computed(() => info.value?.info || null);
const showModal = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const loading = ref(false)
const battleRecords = ref(null)
const expandedMembers = ref(new Set())
const queryDate = ref('')

const legionMatch = ref({
  isRegistered: false
})

// 计算属性：总击杀
const totalKills = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return 0
  return battleRecords.value.roleDetailsList.reduce((sum, member) => sum + (member.winCnt || 0), 0)
})

// 计算属性：总复活
const totalRevives = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return 0
  return battleRecords.value.roleDetailsList.reduce((sum, member) => sum + Math.max((member.loseCnt || 0) - 6, 0), 0)
})

// 计算属性：总K/D
const totalKD = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return 0
  const totalKills = battleRecords.value.roleDetailsList.reduce((sum, member) => sum + (member.winCnt || 0), 0)
  const totalLosses = battleRecords.value.roleDetailsList.reduce((sum, member) => sum + (member.loseCnt || 0), 0)
  if (totalLosses === 0) return 0
  return (totalKills / totalLosses).toFixed(2)
})

// 计算属性：击杀榜 Top3
const killRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
      .sort((a, b) => (b.winCnt || 0) - (a.winCnt || 0))
      .slice(0, 3)
})

// 计算属性：K/D榜 Top3
const kdRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
      .map(member => ({
        ...member,
        kd: parseFloat((member.winCnt && member.loseCnt ? member.winCnt/member.loseCnt : 0.00)).toFixed(2)
      }))
      .sort((a, b) => b.kd - a.kd)
      .slice(0, 3)
})

// 计算属性：复活榜 Top3
const reviveRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
      .map(member => ({
        ...member,
        reviveCnt: Math.max((member.loseCnt || 0) - 6, 0)
      }))
      .sort((a, b) => b.reviveCnt - a.reviveCnt)
      .slice(0, 3)
})

// 格式化战力
const formatPower = (power) => {
  if (!power) return '0'
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + '亿'
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + '万'
  }
  return power.toString()
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const disabledDate = current => {
  return (current.getDay() != 6 && current.getDay() != 0) || current > Date.now()
}

//日期选择时调用查询战绩方法
const fetchBattleRecordsByDate = (val)=>{
  if(undefined != val){
    queryDate.value = val
  }else{
    queryDate.value = getLastSaturday();
  }
  fetchBattleRecords();
}

// 查询战绩
const fetchBattleRecords = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择游戏角色')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  if (wsStatus !== 'connected') {
    message.error('WebSocket未连接，无法查询战绩')
    return
  }

  loading.value = true

  try {
    const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        'legionwar_getdetails',
        { date: queryDate.value },
        10000
    )

    if (result && result.roleDetailsList) {
      // 按击杀数从高到低排序
      const sortedRoleDetailsList = [...result.roleDetailsList].sort((a, b) => {
        return (b.winCnt || 0) - (a.winCnt || 0)
      })
      battleRecords.value = {
        ...result,
        roleDetailsList: sortedRoleDetailsList
      }
      message.success('战绩加载成功，已按击杀数从高到低排序')
    } else {
      battleRecords.value = null
      message.warning('未查询到战绩数据')
    }
  } catch (error) {
    console.error('查询战绩失败:', error)
    message.error(`查询失败: ${error.message}`)
    battleRecords.value = null
  } finally {
    loading.value = false
  }
}

// 刷新战绩
const handleRefresh = () => {
  fetchBattleRecords()
}

// 导出战绩
const handleExport = async () => {
  if (!battleRecords.value || !battleRecords.value.roleDetailsList) {
    message.warning('没有可导出的数据')
    return
  }

  try {
    if (exportmethod.value.includes('1')) {
      const exportText = formatBattleRecordsForExport(battleRecords.value.roleDetailsList, queryDate.value)
    }
    if (exportmethod.value.includes('2')) {
      exportToImage()
    }
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

const exportToImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    alert('未找到要导出的DOM元素');
    return;
  }

  try {
    // 临时移除滚动限制，确保所有内容都可见
    const tableBody = exportDom.value.querySelector('.table-body');
    const originalMaxHeight = tableBody?.style.maxHeight;
    const originalOverflow = tableBody?.style.overflow;

    if (tableBody) {
      tableBody.style.maxHeight = 'none';
      tableBody.style.overflow = 'visible';
    }

    // 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片
      backgroundColor: '#ffffff', // 白色背景
      logging: false // 关闭控制台日志
    });

    // 恢复原始样式
    if (tableBody) {
      tableBody.style.maxHeight = originalMaxHeight;
      tableBody.style.overflow = originalOverflow;
    }

    // Canvas转图片链接
    const imgUrl = canvas.toDataURL('image/png');

    // 创建下载链接
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = `${queryDate.value.replace(/\//g, '年')}日盐场战报.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('DOM转图片失败：', err);
    alert('导出图片失败，请重试');
  }
};

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear()
}

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords
})

// Inline 模式：挂载后自动拉取
onMounted(() => {
  if (props.inline) {
    queryDate.value = getLastSaturday()
    fetchBattleRecords()
  }
})
</script>

<style scoped lang="scss">
// 全局样式变量
$primary-color: #165DFF;
$success-color: #00B42A;
$warning-color: #FF7D00;
$danger-color: #F53F3F;
$gray-color: #86909C;
$light-gray: #F2F3F5;
$border-color: #E5E6EB;
$card-bg: #FFFFFF;
$text-primary: #1D2129;
$text-secondary: #4E5969;
$text-placeholder: #86909C;

.battle-records-wrapper {
  font-size: 14px;
  color: $text-primary;
}

// Inline模式容器
.inline-container {
  background: $card-bg;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

// 页面头部
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: $primary-color;
  color: white;

  .main-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .operation-group {
    display: flex;
    gap: 16px;

    .operation-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .date-picker {
      width: 180px;

      :deep(.ant-picker) {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        color: white;

        &:hover {
          border-color: white;
        }
      }

      :deep(.ant-picker-input input) {
        color: white;
      }
    }

    .refresh-btn, .export-btn {
      background: rgba(255, 255, 255, 0.2);
      border-color: transparent;
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    .export-btn {
      background: white;
      color: $primary-color;

      &:hover {
        background: $light-gray;
      }
    }
  }
}

// 内容容器
.content-wrapper {
  padding: 20px;
}

// 加载和空状态
.loading-container, .empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

// 战绩容器
.records-container {
  .title-banner {
    text-align: center;
    padding: 16px;
    margin-bottom: 20px;
    background: $light-gray;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;

    .date-text {
      color: $primary-color;
      margin-right: 8px;
    }

    .club-text {
      color: $text-primary;
    }
  }

  // 主内容左右布局
  .main-content-layout {
    display: flex;
    gap: 20px;

    .left-section {
      flex: 3; // 战神榜占更大比例
      background: $card-bg;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .right-section {
      flex: 2; // 数据模块占较小比例
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
  }
}

// 总体数据统计
.summary-stats {
  background: $card-bg;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 16px;

  .summary-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: $text-primary;
    padding-left: 4px;
    border-left: 4px solid $primary-color;
  }

  .stats-cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    .stat-card {
      background: $light-gray;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      border-left: 3px solid transparent;

      &.kill-card {
        border-left-color: $danger-color;
      }

      &.revive-card {
        border-left-color: $warning-color;
      }

      &.kd-card {
        border-left-color: $success-color;
      }

      .stat-label {
        font-size: 13px;
        color: $text-secondary;
        margin-bottom: 6px;
        display: block;
        text-align: left;
      }

      .stat-value {
        font-size: 22px;
        font-weight: 700;

        .kill-card & {
          color: $danger-color;
        }

        .revive-card & {
          color: $warning-color;
        }

        .kd-card & {
          color: $success-color;
        }
      }
    }
  }
}

// Top3榜单
.top-rankings {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .rank-card {
    background: $card-bg;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;

    .rank-card-header {
      background: $light-gray;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      border-bottom: 1px solid $border-color;
    }

    .rank-list {
      padding: 12px 16px;

      .rank-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid $light-gray;

        &:last-child {
          border-bottom: none;
        }

        &.rank-1 .rank-badge {
          background: #FFD700;
          color: #000;
        }

        &.rank-2 .rank-badge {
          background: #C0C0C0;
          color: #000;
        }

        &.rank-3 .rank-badge {
          background: #CD7F32;
          color: #000;
        }

        .rank-badge {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: $gray-color;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .player-info {
          display: flex;
          align-items: center;
          flex: 1;

          .avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 8px;
          }

          .avatar-placeholder {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 600;
            margin-right: 8px;
          }

          .name {
            font-size: 13px;
            color: $text-primary;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .rank-value {
          font-size: 13px;
          font-weight: 600;
          color: $primary-color;
          margin-left: 8px;
        }
      }
    }
  }
}

// 战神榜
.god-ranking-section {
  height: 100%;

  .god-ranking-header {
    background: $primary-color;
    color: white;
    padding: 12px 16px;
    font-size: 15px;
    font-weight: 600;
  }

  .god-ranking-table {
    height: calc(100% - 40px);
    display: flex;
    flex-direction: column;

    .table-header {
      display: flex;
      background: $light-gray;
      border-bottom: 1px solid $border-color;

      .table-col {
        padding: 10px 6px;
        font-size: 12px;
        font-weight: 600;
        color: $text-secondary;
        text-align: center;

        &.rank-col {
          width: 50px;
        }

        &.avatar-col {
          width: 50px;
        }

        &.name-col {
          flex: 1;
          min-width: 100px;
          text-align: left;
          padding-left: 12px;
        }

        &.stat-col {
          width: 60px;
        }
      }
    }

    .table-body {
      flex: 1;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 5px;
      }

      &::-webkit-scrollbar-track {
        background: $light-gray;
      }

      &::-webkit-scrollbar-thumb {
        background: $border-color;
        border-radius: 3px;
      }

      .table-row {
        display: flex;
        border-bottom: 1px solid $light-gray;

        &:hover {
          background: $light-gray;
        }

        &:last-child {
          border-bottom: none;
        }

        &.row-1 .row-rank-badge {
          background: #FFD700;
          color: #000;
        }

        &.row-2 .row-rank-badge {
          background: #C0C0C0;
          color: #000;
        }

        &.row-3 .row-rank-badge {
          background: #CD7F32;
          color: #000;
        }

        .table-col {
          padding: 10px 6px;
          font-size: 13px;
          color: $text-primary;
          text-align: center;

          &.rank-col {
            width: 50px;

            .row-rank-badge {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: $gray-color;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 600;
              margin: 0 auto;
            }
          }

          &.avatar-col {
            width: 50px;

            .row-avatar {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              object-fit: cover;
            }

            .row-avatar-placeholder {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 600;
              margin: 0 auto;
            }
          }

          &.name-col {
            flex: 1;
            min-width: 100px;
            text-align: left;
            padding-left: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          &.stat-col {
            width: 60px;
          }
        }
      }
    }
  }
}

// Modal模式样式
.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-date-picker {
  width: 180px;
  margin-right: 8px;
}

.modal-content {
  padding: 16px;
}

.modal-records-container {
  .main-content-layout {
    display: flex;
    gap: 16px;

    .left-section {
      flex: 3;
    }

    .right-section {
      flex: 2;
      gap: 16px;
    }
  }
}

.modal-summary {
  padding: 12px;
}

.modal-top-rankings {
  gap: 12px;
}

// 响应式适配
@media (max-width: 1200px) {
  .records-container .main-content-layout,
  .modal-records-container .main-content-layout {
    flex-direction: column;
  }

  .right-section {
    order: -1; // 移动端先展示数据模块
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .operation-group {
      width: 100%;
      flex-direction: column;
      gap: 8px;

      .operation-item {
        width: 100%;
        justify-content: space-between;
      }
    }
  }

  .god-ranking-table {
    overflow-x: auto;

    .table-header, .table-row {
      min-width: 650px;
    }
  }
}
</style>