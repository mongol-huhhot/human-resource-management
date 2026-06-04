<template>
  <v-app>
    <v-layout>
      <!-- Side Menu -->
      <v-navigation-drawer
        permanent
        width="230"
        color="blue"
        class="text-white"
      >
        <div class="pa-4 text-h6 font-weight-bold">
          SURUPAs
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
              <v-badge
                v-if="item.badge"
                :content="item.badge"
                color="red"
                inline
              />
            </template>
          </v-list-item>
        </v-list>

        <template #append>
          <div class="pa-4 text-caption">
            <v-icon size="18">mdi-chevron-left</v-icon>
            メニューを折りたたむ
          </div>
        </template>
      </v-navigation-drawer>

      <!-- Main -->
      <v-main class="bg-grey-lighten-5">
        <!-- Header -->
        <v-app-bar flat color="white" height="64">
          <v-app-bar-nav-icon />
          <v-toolbar-title class="font-weight-bold">
            勤怠ダッシュボード
          </v-toolbar-title>

          <v-spacer />

          <v-btn icon>
            <v-badge content="12" color="red">
              <v-icon>mdi-bell-outline</v-icon>
            </v-badge>
          </v-btn>

          <v-btn icon>
            <v-icon>mdi-help-circle-outline</v-icon>
          </v-btn>

          <v-avatar size="36" class="ml-3">
            <v-img src="https://randomuser.me/api/portraits/women/44.jpg" />
          </v-avatar>

          <div class="ml-2 mr-4 text-caption">
            <div class="font-weight-bold">山田 花子</div>
            <div>人事部</div>
          </div>
        </v-app-bar>

        <v-container fluid class="pa-6">
          <!-- Date / Buttons -->
          <v-row align="center" class="mb-4">
            <v-col>
              <div class="text-h5 font-weight-bold">
                2025年5月19日
                <span class="text-caption">（月）</span>
                <v-icon size="20" class="ml-2">mdi-calendar-month</v-icon>
              </div>
            </v-col>

            <v-col cols="auto">
              <v-btn variant="outlined" prepend-icon="mdi-refresh">
                更新
              </v-btn>
            </v-col>

            <v-col cols="auto">
              <v-btn color="blue" prepend-icon="mdi-cog-outline">
                ダッシュボード設定
              </v-btn>
            </v-col>
          </v-row>

          <!-- Summary Cards -->
          <v-row>
            <v-col
              v-for="card in summaryCards"
              :key="card.title"
              cols="12"
              sm="6"
              md="2"
            >
              <v-card rounded="lg" elevation="1" class="pa-4">
                <div class="text-caption font-weight-bold mb-3">
                  {{ card.title }}
                </div>

                <div class="d-flex align-center mb-2">
                  <v-avatar :color="card.color" size="42" class="mr-3">
                    <v-icon color="white">{{ card.icon }}</v-icon>
                  </v-avatar>

                  <div>
                    <span class="text-h5 font-weight-bold">
                      {{ card.value }}
                    </span>
                    <span class="text-caption ml-1">名</span>
                  </div>
                </div>

                <div class="text-caption text-grey">
                  全体の {{ card.percent }}%
                </div>

                <v-progress-linear
                  :model-value="card.percent"
                  :color="card.color"
                  height="4"
                  rounded
                  class="mt-2"
                />
              </v-card>
            </v-col>
          </v-row>

          <!-- Main Panels -->
          <v-row class="mt-2">
            <!-- Attendance Status -->
            <v-col cols="12" md="6">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="text-subtitle-1 font-weight-bold">
                  打刻状況
                </v-card-title>

                <v-divider />

                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="5" class="text-center">
                      <div class="donut">
                        <div>
                          <div class="text-subtitle-2">打刻率</div>
                          <div class="text-h4 font-weight-bold">97.9%</div>
                        </div>
                      </div>
                    </v-col>

                    <v-col cols="12" md="7">
                      <div
                        v-for="item in attendanceStatus"
                        :key="item.label"
                        class="d-flex align-center mb-4"
                      >
                        <v-icon :color="item.color" class="mr-3">
                          mdi-square
                        </v-icon>

                        <div class="flex-grow-1">
                          {{ item.label }}
                        </div>

                        <div class="text-caption">
                          {{ item.count }}名（{{ item.percent }}%）
                        </div>
                      </div>
                    </v-col>
                  </v-row>

                  <div class="text-right">
                    <v-btn variant="text" color="blue">
                      打刻状況を確認する
                      <v-icon end>mdi-chevron-right</v-icon>
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Alerts -->
            <v-col cols="12" md="6">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="d-flex align-center">
                  <span class="text-subtitle-1 font-weight-bold">
                    本日のアラート
                  </span>

                  <v-spacer />

                  <v-btn
                    size="small"
                    variant="tonal"
                    color="blue"
                    prepend-icon="mdi-robot-outline"
                  >
                    AIチェック
                  </v-btn>

                  <span class="text-red font-weight-bold ml-3">
                    6件
                  </span>
                </v-card-title>

                <v-divider />

                <v-card-text>
                  <div
                    v-for="alert in alerts"
                    :key="alert.title"
                    class="d-flex align-center py-2 border-b"
                  >
                    <v-chip
                      size="small"
                      :color="alert.color"
                      variant="tonal"
                      class="mr-3"
                    >
                      {{ alert.title }}
                    </v-chip>

                    <div class="flex-grow-1 text-body-2">
                      {{ alert.message }}
                    </div>

                    <div class="text-caption text-grey">
                      {{ alert.time }}
                    </div>
                  </div>

                  <div class="text-right mt-3">
                    <v-btn variant="text" color="blue">
                      すべてのアラートを確認する
                      <v-icon end>mdi-chevron-right</v-icon>
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <!-- Approval List -->
            <v-col cols="12" md="6">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="text-subtitle-1 font-weight-bold">
                  承認待ち一覧
                </v-card-title>

                <v-tabs v-model="approvalTab" density="compact">
                  <v-tab value="all">すべて（11）</v-tab>
                  <v-tab value="attendance">勤怠申請（3）</v-tab>
                  <v-tab value="overtime">残業申請（5）</v-tab>
                  <v-tab value="holiday">休暇申請（3）</v-tab>
                </v-tabs>

                <v-data-table
                  :headers="approvalHeaders"
                  :items="approvalItems"
                  density="compact"
                  hide-default-footer
                >
                  <template #item.type="{ item }">
                    <v-chip
                      size="small"
                      :color="item.color"
                      variant="tonal"
                    >
                      {{ item.type }}
                    </v-chip>
                  </template>
                </v-data-table>

                <div class="text-right pa-3">
                  <v-btn variant="text" color="blue">
                    すべての申請を確認する
                    <v-icon end>mdi-chevron-right</v-icon>
                  </v-btn>
                </div>
              </v-card>
            </v-col>

            <!-- Recent Attendance -->
            <v-col cols="12" md="6">
              <v-card rounded="lg" elevation="1">
                <v-card-title class="text-subtitle-1 font-weight-bold">
                  直近の勤怠状況
                </v-card-title>

                <v-data-table
                  :headers="recentHeaders"
                  :items="recentItems"
                  density="compact"
                  hide-default-footer
                >
                  <template #item.status="{ item }">
                    <v-chip
                      size="small"
                      :color="item.statusColor"
                      variant="tonal"
                    >
                      {{ item.status }}
                    </v-chip>
                  </template>
                </v-data-table>

                <div class="text-right pa-3">
                  <v-btn variant="text" color="blue">
                    勤怠一覧を確認する
                    <v-icon end>mdi-chevron-right</v-icon>
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const approvalTab = ref('all')

const menuItems = [
  { title: 'ダッシュボード', icon: 'mdi-home' },
  { title: '打刻', icon: 'mdi-clock-outline' },
  { title: '勤怠一覧', icon: 'mdi-calendar-text' },
  { title: 'シフト管理', icon: 'mdi-calendar-edit' },
  { title: '勤務パターン管理', icon: 'mdi-calendar-sync' },
  { title: '勤怠申請一覧', icon: 'mdi-calendar-alert', badge: 3 },
  { title: '有給管理', icon: 'mdi-calendar-check' },
  { title: '残業管理', icon: 'mdi-clock-plus-outline' },
  { title: '休暇管理', icon: 'mdi-calendar-remove' },
  { title: '36協定管理', icon: 'mdi-file-document-outline' },
  { title: '勤怠承認', icon: 'mdi-check-decagram-outline', badge: 8 },
  { title: '勤怠締め処理', icon: 'mdi-lock-check-outline' },
  { title: '帳票出力', icon: 'mdi-printer-outline' },
  { title: '各種設定', icon: 'mdi-cog-outline' },
]

const summaryCards = [
  { title: '出勤人数', value: 128, percent: 88.3, color: 'blue', icon: 'mdi-account-group' },
  { title: '欠勤人数', value: 8, percent: 5.5, color: 'red', icon: 'mdi-account-off' },
  { title: '遅刻人数', value: 5, percent: 3.4, color: 'orange', icon: 'mdi-clock-alert-outline' },
  { title: '残業人数', value: 23, percent: 15.9, color: 'deep-purple', icon: 'mdi-weather-night' },
  { title: '有給取得人数', value: 12, percent: 8.3, color: 'green', icon: 'mdi-airplane' },
  { title: '未打刻人数', value: 3, percent: 2.1, color: 'amber', icon: 'mdi-alert-outline' },
]

const attendanceStatus = [
  { label: '出勤済み', count: 128, percent: 88.3, color: 'blue' },
  { label: '勤務中', count: 12, percent: 8.3, color: 'light-blue' },
  { label: '未打刻', count: 3, percent: 2.1, color: 'red' },
  { label: '休暇・その他', count: 2, percent: 1.3, color: 'grey' },
]

const alerts = [
  { title: '残業超過', message: '月の残業時間が45時間を超えた社員が5名います。', time: '10:30', color: 'red' },
  { title: '連続勤務', message: '連続勤務が6日以上の社員が3名います。', time: '09:15', color: 'red' },
  { title: '打刻漏れ', message: '未打刻の可能性がある社員が3名います。', time: '09:00', color: 'orange' },
  { title: '有給不足', message: '有給休暇の取得日数が少ない社員が12名います。', time: '08:45', color: 'green' },
  { title: '過重労働', message: '月の労働時間が60時間を超えそうな社員が8名います。', time: '08:30', color: 'red' },
  { title: '深夜労働', message: '深夜労働が発生している社員が2名います。', time: '08:10', color: 'red' },
]

const approvalHeaders = [
  { title: '申請種別', key: 'type' },
  { title: '申請者', key: 'name' },
  { title: '申請内容', key: 'content' },
  { title: '申請日', key: 'date' },
]

const approvalItems = [
  { type: '勤怠申請', name: '佐藤 太郎', content: '出勤時間修正（5/19）', date: '05/19 09:15', color: 'green' },
  { type: '残業申請', name: '鈴木 一郎', content: '残業申請（5/18）', date: '05/18 18:45', color: 'orange' },
  { type: '休暇申請', name: '高橋 美咲', content: '有給休暇申請（5/20）', date: '05/18 17:30', color: 'amber' },
]

const recentHeaders = [
  { title: '日付', key: 'date' },
  { title: '出勤', key: 'start' },
  { title: '退勤', key: 'end' },
  { title: '労働時間', key: 'workTime' },
  { title: '残業時間', key: 'overtime' },
  { title: 'ステータス', key: 'status' },
]

const recentItems = [
  { date: '5/19（月）', start: '08:58', end: '-', workTime: '-', overtime: '-', status: '勤務中', statusColor: 'blue' },
  { date: '5/16（金）', start: '08:55', end: '18:32', workTime: '8:37', overtime: '1:37', status: '確定', statusColor: 'green' },
  { date: '5/15（木）', start: '08:57', end: '18:45', workTime: '8:48', overtime: '1:48', status: '確定', statusColor: 'green' },
  { date: '5/14（水）', start: '08:52', end: '18:20', workTime: '8:28', overtime: '1:28', status: '確定', statusColor: 'green' },
  { date: '5/13（火）', start: '08:59', end: '18:35', workTime: '8:36', overtime: '1:36', status: '確定', statusColor: 'green' },
]
</script>

<style scoped>
.donut {
  width: 210px;
  height: 210px;
  margin: auto;
  border-radius: 50%;
  background:
    conic-gradient(
      #2196f3 0deg 352deg,
      #ff6b81 352deg 360deg
    );
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut::before {
  content: '';
  position: absolute;
  width: 132px;
  height: 132px;
  background: white;
  border-radius: 50%;
}

.donut > div {
  position: relative;
  z-index: 1;
}

.border-b {
  border-bottom: 1px solid #eee;
}
</style>
