<template>
  <v-app>
    <v-layout>
      <v-navigation-drawer permanent width="230" color="#18aeea" class="text-white">
        <div class="pa-4">
          <div class="text-h6 font-weight-bold">SURUPAs</div>
          <div class="text-caption">スルパス</div>
        </div>

        <v-list nav density="comfortable">
          <v-list-item
            v-for="item in menuItems"
            :key="item.title"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
          >
            <template #append>
              <v-badge v-if="item.badge" :content="item.badge" color="white" inline />
            </template>
          </v-list-item>
        </v-list>

        <template #append>
          <div class="pa-4">
            <v-card class="pa-3" rounded="lg">
              <div class="text-caption text-blue font-weight-bold">スマホアプリで<br />簡単打刻！</div>
              <v-btn size="small" color="blue" variant="tonal" class="mt-2">ダウンロード</v-btn>
            </v-card>
            <div class="text-caption mt-8">© SURUPAs Inc.</div>
          </div>
        </template>
      </v-navigation-drawer>

      <v-main class="bg-grey-lighten-5">
        <v-app-bar flat color="white" height="64">
          <v-app-bar-nav-icon />
          <v-toolbar-title class="font-weight-bold">勤怠ダッシュボード</v-toolbar-title>
          <v-spacer />
          <v-btn icon><v-badge content="12" color="red"><v-icon>mdi-bell-outline</v-icon></v-badge></v-btn>
          <v-btn icon><v-icon>mdi-help-circle-outline</v-icon></v-btn>
          <v-avatar size="36" class="ml-3"><v-img src="https://randomuser.me/api/portraits/women/44.jpg" /></v-avatar>
          <div class="ml-2 mr-4 text-caption">
            <div class="font-weight-bold">山田 太郎</div>
            <div>人事部</div>
          </div>
        </v-app-bar>

        <v-container fluid class="pa-6">
          <v-row>
            <v-col v-for="card in summaryCards" :key="card.title" cols="12" sm="6" md="3" lg="1-7">
              <v-card rounded="lg" elevation="1" class="pa-4 summary-card">
                <div class="d-flex align-center">
                  <v-avatar :color="card.color" size="48" class="mr-3">
                    <v-icon color="white">{{ card.icon }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-caption font-weight-bold">{{ card.title }}</div>
                    <div>
                      <span class="text-h5 font-weight-bold">{{ card.value }}</span>
                      <span class="text-caption"> / {{ card.total }}名</span>
                    </div>
                    <div class="text-caption font-weight-bold">{{ card.sub }}</div>
                  </div>
                </div>
                <v-progress-linear :model-value="card.percent" :color="card.color" height="5" rounded class="mt-3" />
              </v-card>
            </v-col>
          </v-row>

          <v-row class="mt-2">
            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="d-flex">
                  <span class="text-subtitle-1 font-weight-bold">本日の打刻</span>
                  <v-spacer />
                  <v-btn variant="text" color="blue" size="small" prepend-icon="mdi-refresh">更新</v-btn>
                </v-card-title>

                <v-card-text>
                  <div class="d-flex">
                    <v-avatar size="72" class="mr-4">
                      <v-img src="https://randomuser.me/api/portraits/men/32.jpg" />
                    </v-avatar>
                    <div>
                      <div class="text-h6 font-weight-bold">山田 太郎</div>
                      <div class="text-body-2">人事部　人事課</div>
                      <div class="text-h4 font-weight-bold mt-4">09:00:16</div>
                    </div>
                    <v-chip color="blue" variant="tonal" class="ml-auto mt-16">出勤中</v-chip>
                  </div>

                  <div class="d-flex mt-6">
                    <v-btn color="blue" size="large" class="mr-3" prepend-icon="mdi-login">出勤</v-btn>
                    <v-btn color="blue-grey" size="large" prepend-icon="mdi-logout">退勤</v-btn>
                  </div>

                  <v-divider class="my-5" />

                  <v-row dense>
                    <v-col cols="5" class="text-caption font-weight-bold">勤務パターン</v-col>
                    <v-col class="text-caption">通常勤務（09:00〜18:00）</v-col>
                    <v-col cols="5" class="text-caption font-weight-bold">今日の予定</v-col>
                    <v-col class="text-caption">会議 10:00〜 / 面談 14:00〜</v-col>
                  </v-row>

                  <div class="text-right mt-3">
                    <v-btn variant="text" color="blue">打刻履歴を確認する <v-icon end>mdi-chevron-right</v-icon></v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="d-flex align-center">
                  <span class="text-subtitle-1 font-weight-bold">シフトカレンダー</span>
                  <v-spacer />
                  <v-btn icon size="small"><v-icon>mdi-chevron-left</v-icon></v-btn>
                  <v-btn icon size="small"><v-icon>mdi-chevron-right</v-icon></v-btn>
                  <v-btn size="small" variant="tonal" class="ml-1">今日</v-btn>
                </v-card-title>

                <v-card-text>
                  <div class="text-center font-weight-bold mb-3">2025年5月</div>
                  <div class="calendar-grid">
                    <div v-for="d in weekDays" :key="d" class="calendar-head">{{ d }}</div>
                    <div
                      v-for="day in calendarDays"
                      :key="day.key"
                      class="calendar-day"
                      :class="{ active: day.day === 20, muted: day.muted }"
                    >
                      <div>{{ day.day }}</div>
                      <div v-if="day.mark" class="calendar-dot" />
                      <v-chip v-if="day.label" size="x-small" :color="day.color" variant="tonal">{{ day.label }}</v-chip>
                    </div>
                  </div>

                  <div class="d-flex flex-wrap mt-4 text-caption legend">
                    <span>● 出勤</span>
                    <span>● 休み</span>
                    <span>● 有給</span>
                    <span>● 遅番</span>
                    <span>● 早番</span>
                    <span>● 夜勤</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="d-flex">
                  <span class="text-subtitle-1 font-weight-bold">アラート・お知らせ</span>
                  <v-spacer />
                  <v-btn variant="text" color="blue" size="small">すべて見る</v-btn>
                </v-card-title>

                <v-card-text>
                  <div v-for="alert in alerts" :key="alert.title" class="d-flex align-start py-3 border-b">
                    <v-avatar :color="alert.color" size="40" class="mr-3">
                      <v-icon color="white">{{ alert.icon }}</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="font-weight-bold text-body-2">{{ alert.title }}</div>
                      <div class="text-caption">{{ alert.message }}</div>
                    </div>
                    <div class="text-caption text-grey">{{ alert.time }}</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="d-flex">
                  <span class="text-subtitle-1 font-weight-bold">本日の勤務状況一覧</span>
                  <v-spacer />
                  <v-btn-toggle density="compact" variant="tonal">
                    <v-btn size="small">すべて</v-btn>
                    <v-btn size="small">出勤中</v-btn>
                    <v-btn size="small">未打刻</v-btn>
                    <v-btn size="small">遅刻</v-btn>
                  </v-btn-toggle>
                </v-card-title>

                <v-data-table :headers="workHeaders" :items="workItems" density="compact" hide-default-footer>
                  <template #item.name="{ item }">
                    <div class="d-flex align-center">
                      <v-avatar size="28" class="mr-2"><v-img :src="item.avatar" /></v-avatar>
                      <span class="text-blue font-weight-bold">{{ item.name }}</span>
                    </div>
                  </template>
                  <template #item.status="{ item }">
                    <v-chip size="small" :color="item.color" variant="tonal">{{ item.status }}</v-chip>
                  </template>
                </v-data-table>

                <div class="text-right pa-3">
                  <v-btn variant="text" color="blue">すべての勤務一覧を見る <v-icon end>mdi-chevron-right</v-icon></v-btn>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="d-flex">
                  <span class="text-subtitle-1 font-weight-bold">今月の残業時間（部署別）</span>
                  <v-spacer />
                  <v-btn variant="text" color="blue" size="small">詳細を見る</v-btn>
                </v-card-title>

                <v-card-text>
                  <div class="bar-chart">
                    <div v-for="bar in overtimeBars" :key="bar.label" class="bar-wrap">
                      <div class="bar-value">{{ bar.value }}</div>
                      <div class="bar" :style="{ height: `${bar.height}px` }"></div>
                      <div class="bar-label">{{ bar.label }}</div>
                    </div>
                  </div>

                  <v-divider class="my-4" />

                  <v-row>
                    <v-col>
                      <div class="text-caption">全社残業時間</div>
                      <div class="text-h5 font-weight-bold">656.5時間</div>
                    </v-col>
                    <v-col>
                      <div class="text-caption">平均残業時間/人</div>
                      <div class="text-h5 font-weight-bold">12.8時間/人</div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="1" class="mb-4">
                <v-card-title class="text-subtitle-1 font-weight-bold">クイックメニュー</v-card-title>
                <v-card-text>
                  <v-row dense>
                    <v-col v-for="q in quickMenus" :key="q.title" cols="4">
                      <v-btn block height="70" variant="outlined" color="blue">
                        <div>
                          <v-icon size="28">{{ q.icon }}</v-icon>
                          <div class="text-caption mt-1">{{ q.title }}</div>
                        </div>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <v-card rounded="lg" elevation="1">
                <v-card-title class="text-subtitle-1 font-weight-bold">よく使う機能</v-card-title>
                <v-card-text>
                  <v-chip v-for="tag in commonTags" :key="tag" color="blue" variant="tonal" class="ma-1">
                    {{ tag }}
                  </v-chip>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
const menuItems = [
  { title: 'ダッシュボード', icon: 'mdi-home' },
  { title: '打刻管理', icon: 'mdi-clock-outline' },
  { title: '勤怠一覧', icon: 'mdi-calendar-text' },
  { title: 'シフト管理', icon: 'mdi-calendar-edit' },
  { title: '申請・承認', icon: 'mdi-file-check-outline', badge: 8 },
  { title: '有給管理', icon: 'mdi-account-clock-outline' },
  { title: '残業管理', icon: 'mdi-clock-plus-outline' },
  { title: '勤怠集計', icon: 'mdi-chart-box-outline' },
  { title: '36 協定管理', icon: 'mdi-file-document-outline' },
  { title: '帳票出力', icon: 'mdi-file-export-outline' },
  { title: '設定管理', icon: 'mdi-cog-outline' },
]

const summaryCards = [
  { title: '出勤人数', value: 128, total: 156, sub: '出勤率 82.1%', percent: 82, color: 'blue', icon: 'mdi-account-group' },
  { title: '欠勤人数', value: 15, total: '', sub: '欠勤率 9.6%', percent: 35, color: 'pink', icon: 'mdi-account-off' },
  { title: '遅刻人数', value: 8, total: '', sub: '遅刻率 5.1%', percent: 25, color: 'orange', icon: 'mdi-clock-alert-outline' },
  { title: '残業人数', value: 34, total: '', sub: '残業時間 96.5h', percent: 70, color: 'light-blue', icon: 'mdi-calendar-clock' },
  { title: '有給取得者', value: 12, total: '', sub: '取得率 7.7%', percent: 30, color: 'deep-purple', icon: 'mdi-calendar-check' },
  { title: '未打刻者', value: 3, total: '', sub: '未打刻率 1.9%', percent: 15, color: 'blue', icon: 'mdi-bell-off-outline' },
  { title: '承認待ち', value: 8, total: '', sub: '申請件数 8件', percent: 20, color: 'orange', icon: 'mdi-lock-open-outline' },
]

const weekDays = ['日', '月', '火', '水', '木', '金', '土']

const calendarDays = [
  ...[27, 28, 29, 30].map((d, i) => ({ key: `p${i}`, day: d, muted: true })),
  ...Array.from({ length: 31 }, (_, i) => ({
    key: `m${i + 1}`,
    day: i + 1,
    mark: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 15, 23, 24, 25, 28, 30].includes(i + 1),
    label: i + 1 === 23 ? '休' : i + 1 === 24 ? '遅' : i + 1 === 28 ? '有' : i + 1 === 30 ? '早' : '',
    color: i + 1 === 23 ? 'pink' : i + 1 === 24 ? 'orange' : i + 1 === 28 ? 'deep-purple' : 'green',
  })),
  ...[1, 2, 3, 4, 5, 6, 7].map((d, i) => ({ key: `n${i}`, day: d, muted: true })),
]

const alerts = [
  { title: '36協定アラート', message: '月45時間超えが 5 名います', time: '10分前', color: 'red', icon: 'mdi-alert-outline' },
  { title: '打刻漏れ', message: '未打刻者が 3 名います', time: '20分前', color: 'orange', icon: 'mdi-clock-alert-outline' },
  { title: '有給取得推奨', message: '取得推奨者が 8 名います', time: '1時間前', color: 'blue', icon: 'mdi-information-outline' },
  { title: '申請承認待ち', message: '承認待ち申請が 8 件あります', time: '2時間前', color: 'green', icon: 'mdi-check' },
]

const workHeaders = [
  { title: '氏名', key: 'name' },
  { title: '所属', key: 'department' },
  { title: '勤務状況', key: 'status' },
  { title: '出勤時刻', key: 'start' },
  { title: '残業時間', key: 'overtime' },
]

const workItems = [
  { name: '山田 太郎', department: '人事部', status: '出勤中', start: '09:00', overtime: '1:30', color: 'green', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: '鈴木 花子', department: '営業部', status: '遅刻', start: '09:15', overtime: '-', color: 'orange', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { name: '佐藤 健一', department: '開発部', status: '未打刻', start: '-', overtime: '-', color: 'grey', avatar: 'https://randomuser.me/api/portraits/men/34.jpg' },
  { name: '田中 美咲', department: '経理部', status: '出勤中', start: '08:55', overtime: '2:15', color: 'green', avatar: 'https://randomuser.me/api/portraits/women/35.jpg' },
  { name: '高橋 一郎', department: '総務部', status: '休み', start: '-', overtime: '-', color: 'pink', avatar: 'https://randomuser.me/api/portraits/men/36.jpg' },
]

const overtimeBars = [
  { label: '開発部', value: 210.5, height: 120 },
  { label: '営業部', value: 145.2, height: 85 },
  { label: '人事部', value: 126.8, height: 75 },
  { label: '経理部', value: 98.4, height: 58 },
  { label: '総務部', value: 75.6, height: 45 },
]

const quickMenus = [
  { title: '打刻修正申請', icon: 'mdi-file-document-edit-outline' },
  { title: '有給申請', icon: 'mdi-calendar-check' },
  { title: '残業申請', icon: 'mdi-history' },
  { title: 'シフト確認', icon: 'mdi-calendar-month' },
  { title: '勤怠集計', icon: 'mdi-file-chart-outline' },
  { title: '帳票出力', icon: 'mdi-file-export-outline' },
]

const commonTags = ['勤怠一覧', '申請承認', 'シフト管理', '有給残数確認']
</script>

<style scoped>
.summary-card {
  min-height: 118px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.calendar-head {
  text-align: center;
  font-weight: bold;
  font-size: 12px;
  color: #506070;
}

.calendar-day {
  height: 42px;
  text-align: center;
  font-size: 13px;
  border-radius: 10px;
  padding-top: 3px;
  position: relative;
}

.calendar-day.active {
  background: #2196f3;
  color: white;
  font-weight: bold;
}

.calendar-day.muted {
  color: #9e9e9e;
}

.calendar-dot {
  width: 6px;
  height: 6px;
  background: #2196f3;
  border-radius: 50%;
  margin: 4px auto 0;
}

.legend {
  gap: 14px;
}

.border-b {
  border-bottom: 1px solid #eee;
}

.bar-chart {
  height: 230px;
  display: flex;
  align-items: end;
  justify-content: space-around;
  border-left: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding-top: 20px;
}

.bar-wrap {
  text-align: center;
  width: 56px;
}

.bar {
  width: 32px;
  margin: auto;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(#42a5f5, #1e88e5);
}

.bar-value {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 4px;
}

.bar-label {
  font-size: 12px;
  margin-top: 8px;
}
</style>