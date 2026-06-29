<template>
  <v-app :theme="'light'" style="font-family: 'Inter', sans-serif;">

    <!-- Sidebar -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      color="#0F1C2E"
      width="220"
      rail-width="60"
    >
      <v-list-item
        :title="rail ? '' : 'StoreOps'"
        subtitle=""
        nav
        style="padding: 18px 16px 10px;"
      >
        <template #prepend>
          <div style="
            width:32px; height:32px; border-radius:8px;
            background:#EF9F27; display:flex;
            align-items:center; justify-content:center;
            font-weight:700; font-size:14px; color:#0F1C2E;
            flex-shrink:0;
          ">S</div>
        </template>
        <template #append>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            size="small"
            color="rgba(255,255,255,0.4)"
            @click="rail = !rail"
          />
        </template>
      </v-list-item>

      <v-divider color="rgba(255,255,255,0.08)" class="mb-2" />

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.key"
          :prepend-icon="item.icon"
          :title="rail ? '' : item.label"
          :value="item.key"
          :active="activeNav === item.key"
          active-color="#EF9F27"
          base-color="rgba(255,255,255,0.5)"
          rounded="lg"
          @click="activeNav = item.key"
        />
      </v-list>

      <template #append>
        <v-divider color="rgba(255,255,255,0.08)" />
        <div style="padding:12px 8px;">
          <v-list-item
            prepend-icon="mdi-cog-outline"
            :title="rail ? '' : 'Settings'"
            base-color="rgba(255,255,255,0.4)"
            density="compact"
            rounded="lg"
          />
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main -->
    <v-main style="background:#F0EEE9;">
      <div style="max-width:1400px; margin:0 auto; padding:24px 28px;">

        <!-- Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
          <div>
            <div style="font-size:22px; font-weight:600; color:#0F1C2E; letter-spacing:-0.3px;">
              週次店舗運用レポート
            </div>
            <div style="font-size:13px; color:#6B7280; margin-top:2px;">
              {{ weekLabel }} &nbsp;·&nbsp; {{ stores.length }} 店舗
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <v-chip
              size="small"
              color="#EF9F27"
              variant="tonal"
              prepend-icon="mdi-alert-circle-outline"
            >
              問題店舗 {{ problemStores.length }} 件
            </v-chip>
            <v-btn
              prepend-icon="mdi-robot-outline"
              color="#0F1C2E"
              variant="flat"
              size="small"
              rounded="lg"
              @click="chatOpen = !chatOpen"
            >
              AI 分析
            </v-btn>
            <v-btn
              icon="mdi-download-outline"
              variant="outlined"
              size="small"
              color="#0F1C2E"
              rounded="lg"
            />
          </div>
        </div>

        <!-- KPI Cards -->
        <v-row dense class="mb-5">
          <v-col
            v-for="kpi in kpiCards"
            :key="kpi.label"
            cols="12" sm="6" md="3"
          >
            <div style="
              background:#fff; border-radius:12px;
              border:0.5px solid #E5E2DB;
              padding:18px 20px;
            ">
              <div style="font-size:12px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:8px;">
                {{ kpi.label }}
              </div>
              <div style="font-size:26px; font-weight:600; color:#0F1C2E; font-family:'JetBrains Mono', monospace; letter-spacing:-0.5px;">
                {{ kpi.value }}
              </div>
              <div style="display:flex; align-items:center; gap:4px; margin-top:6px;">
                <v-icon
                  :icon="kpi.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                  :color="kpi.trend > 0 ? '#10B981' : '#EF4444'"
                  size="16"
                />
                <span :style="{fontSize:'12px', color: kpi.trend > 0 ? '#10B981' : '#EF4444'}">
                  {{ Math.abs(kpi.trend) }}% 前週比
                </span>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Charts Row -->
        <v-row dense class="mb-5">
          <!-- Sales bar chart -->
          <v-col cols="12" md="8">
            <div style="background:#fff; border-radius:12px; border:0.5px solid #E5E2DB; padding:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div style="font-size:14px; font-weight:500; color:#0F1C2E;">地域別売上（今週 vs 先週）</div>
                <v-btn-toggle v-model="chartMode" density="compact" rounded="lg" variant="outlined" color="#0F1C2E">
                  <v-btn size="x-small" value="bar">棒</v-btn>
                  <v-btn size="x-small" value="line">折れ線</v-btn>
                </v-btn-toggle>
              </div>
              <div style="height:200px; display:flex; align-items:flex-end; gap:8px; padding-bottom:24px; position:relative;">
                <!-- Y axis hint -->
                <div style="position:absolute; top:0; left:0; right:0; bottom:24px; display:flex; flex-direction:column; justify-content:space-between; pointer-events:none;">
                  <div v-for="n in 4" :key="n" style="border-top:0.5px dashed #E5E2DB; width:100%; position:relative;">
                    <span style="position:absolute; left:0; top:-9px; font-size:10px; color:#C4C0B8;">{{ (4-n+1)*250 }}万</span>
                  </div>
                </div>
                <!-- Bars -->
                <div
                  v-for="(d, i) in regionData"
                  :key="d.region"
                  style="flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding-left:28px;"
                >
                  <div style="width:100%; display:flex; gap:3px; align-items:flex-end; height:160px;">
                    <div
                      :style="{
                        flex:1, background:'#0F1C2E',
                        height: (d.thisWeek / 1000 * 160) + 'px',
                        borderRadius:'4px 4px 0 0',
                        transition:'height .4s ease'
                      }"
                    />
                    <div
                      :style="{
                        flex:1, background:'#E5E2DB',
                        height: (d.lastWeek / 1000 * 160) + 'px',
                        borderRadius:'4px 4px 0 0',
                        transition:'height .4s ease'
                      }"
                    />
                  </div>
                  <div style="font-size:11px; color:#9CA3AF; text-align:center; margin-top:4px;">{{ d.region }}</div>
                </div>
              </div>
              <div style="display:flex; gap:16px; margin-top:4px;">
                <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:#6B7280;">
                  <div style="width:12px; height:8px; background:#0F1C2E; border-radius:2px;"></div> 今週
                </div>
                <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:#6B7280;">
                  <div style="width:12px; height:8px; background:#E5E2DB; border-radius:2px;"></div> 先週
                </div>
              </div>
            </div>
          </v-col>

          <!-- Issue breakdown -->
          <v-col cols="12" md="4">
            <div style="background:#fff; border-radius:12px; border:0.5px solid #E5E2DB; padding:20px; height:100%;">
              <div style="font-size:14px; font-weight:500; color:#0F1C2E; margin-bottom:16px;">問題分類</div>
              <div style="display:flex; flex-direction:column; gap:10px;">
                <div v-for="issue in issueBreakdown" :key="issue.label">
                  <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                    <span style="color:#374151;">{{ issue.label }}</span>
                    <span style="font-family:'JetBrains Mono',monospace; color:#0F1C2E; font-size:12px;">{{ issue.count }}</span>
                  </div>
                  <div style="height:5px; background:#F0EEE9; border-radius:3px;">
                    <div
                      :style="{
                        height:'100%',
                        width: (issue.count / 12 * 100) + '%',
                        background: issue.color,
                        borderRadius:'3px',
                        transition:'width .5s ease'
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Store Table -->
        <div style="background:#fff; border-radius:12px; border:0.5px solid #E5E2DB; overflow:hidden;">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:0.5px solid #E5E2DB;">
            <div style="font-size:14px; font-weight:500; color:#0F1C2E;">店舗一覧</div>
            <div style="display:flex; gap:8px; align-items:center;">
              <v-text-field
                v-model="search"
                density="compact"
                variant="outlined"
                placeholder="店舗名で検索..."
                prepend-inner-icon="mdi-magnify"
                hide-details
                style="width:200px;"
                rounded="lg"
              />
              <v-select
                v-model="filterRegion"
                :items="['全地域', '東京', '大阪', '名古屋', '福岡']"
                density="compact"
                variant="outlined"
                hide-details
                style="width:120px;"
                rounded="lg"
              />
            </div>
          </div>

          <v-data-table
            :headers="tableHeaders"
            :items="filteredStores"
            :search="search"
            density="compact"
            hide-default-footer
            :items-per-page="-1"
          >
            <!-- Store name -->
            <template #item.name="{ item }">
              <div style="display:flex; align-items:center; gap:8px;">
                <div
                  :style="{
                    width:'8px', height:'8px', borderRadius:'50%',
                    background: item.issues > 0 ? '#EF9F27' : '#10B981',
                    flexShrink:0
                  }"
                  :class="item.issues > 0 ? 'pulse-amber' : ''"
                />
                <span style="font-size:13px; font-weight:500; color:#0F1C2E;">{{ item.name }}</span>
              </div>
            </template>

            <!-- Sales -->
            <template #item.sales="{ item }">
              <span style="font-family:'JetBrains Mono',monospace; font-size:12px; color:#0F1C2E;">
                ¥{{ item.sales.toLocaleString() }}
              </span>
            </template>

            <!-- WoW change -->
            <template #item.wow="{ item }">
              <span :style="{
                fontFamily:'JetBrains Mono,monospace', fontSize:'12px',
                color: item.wow >= 0 ? '#10B981' : '#EF4444'
              }">
                {{ item.wow >= 0 ? '+' : '' }}{{ item.wow }}%
              </span>
            </template>

            <!-- Customers -->
            <template #item.customers="{ item }">
              <span style="font-family:'JetBrains Mono',monospace; font-size:12px; color:#374151;">
                {{ item.customers.toLocaleString() }}
              </span>
            </template>

            <!-- Issues -->
            <template #item.issues="{ item }">
              <v-chip
                v-if="item.issues > 0"
                size="x-small"
                color="#EF9F27"
                variant="tonal"
                style="font-size:11px;"
              >
                {{ item.issues }} 件
              </v-chip>
              <v-icon v-else icon="mdi-check-circle-outline" color="#10B981" size="16" />
            </template>

            <!-- Status -->
            <template #item.status="{ item }">
              <v-chip
                size="x-small"
                :color="statusColor(item.status)"
                variant="tonal"
                style="font-size:11px;"
              >
                {{ item.status }}
              </v-chip>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-robot-outline"
                size="x-small"
                variant="text"
                color="#9CA3AF"
                @click="askAboutStore(item)"
              />
            </template>
          </v-data-table>
        </div>
      </div>
    </v-main>

    <!-- AI Chat Panel -->
    <v-navigation-drawer
      v-model="chatOpen"
      location="right"
      width="380"
      style="border-left:0.5px solid #E5E2DB;"
      temporary
    >
      <div style="display:flex; flex-direction:column; height:100%;">
        <!-- Chat header -->
        <div style="
          padding:16px 20px;
          border-bottom:0.5px solid #E5E2DB;
          display:flex; align-items:center; justify-content:space-between;
          background:#0F1C2E;
        ">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="
              width:28px; height:28px; border-radius:8px;
              background:#EF9F27; display:flex;
              align-items:center; justify-content:center;
            ">
              <v-icon icon="mdi-robot-outline" size="16" color="#0F1C2E" />
            </div>
            <div>
              <div style="font-size:13px; font-weight:600; color:#fff;">AI アナリスト</div>
              <div style="font-size:11px; color:rgba(255,255,255,0.5);">PostgreSQL に接続済み</div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="rgba(255,255,255,0.5)" @click="chatOpen=false" />
        </div>

        <!-- Messages -->
        <div
          ref="chatBody"
          style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:#F8F7F4;"
        >
          <div
            v-for="(msg, i) in messages"
            :key="i"
            :style="{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth:'88%'
            }"
          >
            <div
              :style="{
                padding:'10px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? '#0F1C2E' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#0F1C2E',
                fontSize:'13px',
                lineHeight:'1.6',
                border: msg.role === 'assistant' ? '0.5px solid #E5E2DB' : 'none',
                whiteSpace:'pre-wrap'
              }"
            >{{ msg.content }}</div>
            <div style="font-size:10px; color:#C4C0B8; margin-top:3px; padding:0 4px;">
              {{ msg.time }}
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="aiTyping" style="align-self:flex-start;">
            <div style="
              padding:10px 14px; border-radius:14px 14px 14px 4px;
              background:#fff; border:0.5px solid #E5E2DB;
              display:flex; gap:4px; align-items:center;
            ">
              <div v-for="n in 3" :key="n" :style="{
                width:'6px', height:'6px', borderRadius:'50%',
                background:'#C4C0B8',
                animation:`bounce 1.2s ease-in-out ${(n-1)*0.2}s infinite`
              }"/>
            </div>
          </div>
        </div>

        <!-- Suggested questions -->
        <div style="padding:10px 16px; border-top:0.5px solid #E5E2DB; background:#fff;">
          <div style="font-size:11px; color:#9CA3AF; margin-bottom:8px;">クイック質問</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <v-chip
              v-for="q in suggestedQuestions"
              :key="q"
              size="x-small"
              variant="outlined"
              color="#0F1C2E"
              style="cursor:pointer; font-size:11px;"
              @click="sendSuggestedQuestion(q)"
            >{{ q }}</v-chip>
          </div>
        </div>

        <!-- Input -->
        <div style="padding:12px 16px; border-top:0.5px solid #E5E2DB; background:#fff;">
          <div style="display:flex; gap:8px; align-items:flex-end;">
            <v-textarea
              v-model="chatInput"
              variant="outlined"
              placeholder="役員の質問を入力..."
              density="compact"
              hide-details
              rows="2"
              auto-grow
              max-rows="4"
              rounded="lg"
              style="flex:1; font-size:13px;"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <v-btn
              icon="mdi-send"
              color="#0F1C2E"
              variant="flat"
              size="small"
              rounded="lg"
              :loading="aiTyping"
              @click="sendMessage"
            />
          </div>
          <div style="font-size:10px; color:#C4C0B8; margin-top:6px;">Enter で送信 · Shift+Enter で改行</div>
        </div>
      </div>
    </v-navigation-drawer>

  </v-app>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

// ── Navigation ──────────────────────────────────────────────
const drawer = ref(true)
const rail = ref(false)
const activeNav = ref('dashboard')
const navItems = [
  { key: 'dashboard', icon: 'mdi-view-dashboard-outline', label: 'ダッシュボード' },
  { key: 'stores',    icon: 'mdi-store-outline',           label: '店舗一覧' },
  { key: 'issues',    icon: 'mdi-alert-outline',           label: '問題管理' },
  { key: 'reports',   icon: 'mdi-chart-bar',               label: 'レポート' },
]

// ── Date helpers ─────────────────────────────────────────────
const today = new Date()
const weekStart = new Date(today)
weekStart.setDate(today.getDate() - today.getDay() + 1)
const weekEnd = new Date(weekStart)
weekEnd.setDate(weekStart.getDate() + 6)
const fmt = d => `${d.getMonth()+1}/${d.getDate()}`
const weekLabel = `${today.getFullYear()}年 ${fmt(weekStart)} – ${fmt(weekEnd)}`

// ── KPI Cards ────────────────────────────────────────────────
const kpiCards = [
  { label: '週間総売上',     value: '¥48.2M', trend: 3.2 },
  { label: '総客数',         value: '12,847', trend: 1.8 },
  { label: '客単価',         value: '¥3,752', trend: 1.4 },
  { label: '問題発生店舗数', value: '7 店',   trend: -2 },
]

// ── Chart data ───────────────────────────────────────────────
const chartMode = ref('bar')
const regionData = [
  { region: '東京',   thisWeek: 920, lastWeek: 880 },
  { region: '大阪',   thisWeek: 740, lastWeek: 760 },
  { region: '名古屋', thisWeek: 510, lastWeek: 490 },
  { region: '福岡',   thisWeek: 380, lastWeek: 400 },
  { region: '札幌',   thisWeek: 290, lastWeek: 270 },
]

const issueBreakdown = [
  { label: '在庫切れ',   count: 5, color: '#EF9F27' },
  { label: '人員不足',   count: 4, color: '#D85A30' },
  { label: '設備故障',   count: 2, color: '#EF4444' },
  { label: 'その他',     count: 1, color: '#C4C0B8' },
]

// ── Store table ──────────────────────────────────────────────
const search = ref('')
const filterRegion = ref('全地域')
const chartOpen = ref(false)

const stores = ref([
  { name: '渋谷本店',     region: '東京', sales: 3820000, wow:  4.2, customers: 1042, issues: 0, status: '正常' },
  { name: '新宿南口店',   region: '東京', sales: 3140000, wow: -8.1, customers:  889, issues: 2, status: '要注意' },
  { name: '池袋東口店',   region: '東京', sales: 2950000, wow:  2.7, customers:  831, issues: 0, status: '正常' },
  { name: '梅田グランド', region: '大阪', sales: 2710000, wow: -5.3, customers:  764, issues: 1, status: '要注意' },
  { name: '難波センター', region: '大阪', sales: 2390000, wow:  1.1, customers:  680, issues: 0, status: '正常' },
  { name: '栄店',         region: '名古屋', sales: 1980000, wow: -12.4, customers: 552, issues: 3, status: '警告' },
  { name: '金山店',       region: '名古屋', sales: 1760000, wow:  3.8, customers:  493, issues: 0, status: '正常' },
  { name: '天神本店',     region: '福岡', sales: 1540000, wow:  0.9, customers:  431, issues: 0, status: '正常' },
  { name: '博多駅前店',   region: '福岡', sales: 1320000, wow: -6.7, customers:  370, issues: 1, status: '要注意' },
  { name: '札幌大通店',   region: '札幌', sales: 1190000, wow:  5.2, customers:  331, issues: 0, status: '正常' },
])

const problemStores = computed(() => stores.value.filter(s => s.issues > 0))

const filteredStores = computed(() => {
  let list = stores.value
  if (filterRegion.value !== '全地域') list = list.filter(s => s.region === filterRegion.value)
  return list
})

const tableHeaders = [
  { title: '店舗名',   key: 'name',      sortable: true },
  { title: '地域',     key: 'region',    sortable: true },
  { title: '週間売上', key: 'sales',     sortable: true },
  { title: '前週比',   key: 'wow',       sortable: true },
  { title: '客数',     key: 'customers', sortable: true },
  { title: '問題',     key: 'issues',    sortable: true },
  { title: 'ステータス', key: 'status',  sortable: false },
  { title: '',         key: 'actions',   sortable: false },
]

const statusColor = (s) => ({
  '正常': 'success', '要注意': 'warning', '警告': 'error'
}[s] || 'default')

// ── AI Chat ──────────────────────────────────────────────────
const chatOpen = ref(false)
const chatInput = ref('')
const aiTyping = ref(false)
const chatBody = ref(null)
const messages = ref([
  {
    role: 'assistant',
    content: 'こんにちは。店舗データに接続しています。\n売上・問題店舗・トレンドについて自由にご質問ください。',
    time: nowTime()
  }
])

const suggestedQuestions = [
  '売上ワースト3店舗は？',
  '今週の問題原因を要約して',
  '先週より10%以上落ちた店は？',
  '地域別の客単価比較',
]

function nowTime() {
  return new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

async function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || aiTyping.value) return
  chatInput.value = ''
  messages.value.push({ role: 'user', content: text, time: nowTime() })
  scrollChat()
  await simulateAIResponse(text)
}

async function sendSuggestedQuestion(q) {
  chatInput.value = q
  await sendMessage()
}

function askAboutStore(store) {
  chatOpen.value = true
  nextTick(() => {
    chatInput.value = `${store.name}の今週の状況と問題点を分析してください`
    sendMessage()
  })
}

async function simulateAIResponse(question) {
  aiTyping.value = true
  scrollChat()
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))

  // Simulated responses — replace with real Claude API call
  const responses = {
    '売上ワースト3': `今週の売上ワースト3店舗は以下の通りです：\n\n1. 博多駅前店 ¥1,320,000（前週比 -6.7%）\n2. 札幌大通店 ¥1,190,000（前週比 +5.2%）\n3. 金山店 ¥1,760,000（前週比 +3.8%）\n\n博多駅前店は問題1件が報告されており、引き続き監視が必要です。`,
    '問題原因': `今週の問題12件の内訳：\n\n• 在庫切れ：5件（最多）\n  → 栄店・梅田グランドで集中\n• 人員不足：4件\n  → 週末の急な欠員が主因\n• 設備故障：2件\n  → 新宿南口店のレジ系統\n• その他：1件\n\n対策として、在庫補充の自動発注閾値を15%引き上げることを推薦します。`,
    '10%以上落': `前週比-10%以上の店舗は1店舗です：\n\n🔴 栄店（名古屋）-12.4%\n  売上：¥1,980,000\n  問題：3件（最多）\n  主因：設備故障によるレジ停止（火曜日3時間）\n\n設備修繕が完了すれば翌週の回復が見込まれます。`,
    '客単価': `地域別の客単価比較：\n\n東京　　¥3,912（全国最高）\n大阪　　¥3,694\n名古屋　¥3,571\n福岡　　¥3,474\n札幌　　¥3,592\n\n東京が全国平均（¥3,752）を4.3%上回っています。名古屋は前週比でやや低下傾向です。`
  }

  let reply = 'ご質問の内容をデータベースで確認しました。\n\n該当データが見つかりました。詳細はテーブルをご確認ください。'
  for (const [key, val] of Object.entries(responses)) {
    if (question.includes(key)) { reply = val; break }
  }

  aiTyping.value = false
  messages.value.push({ role: 'assistant', content: reply, time: nowTime() })
  scrollChat()
}

function scrollChat() {
  nextTick(() => {
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
  })
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

.pulse-amber {
  animation: pulseAmber 2s ease-in-out infinite;
}
@keyframes pulseAmber {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}

.v-data-table tbody tr:hover {
  background: #F8F7F4 !important;
}
.v-data-table th {
  font-size: 11px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9CA3AF !important;
  font-weight: 500 !important;
}
</style>