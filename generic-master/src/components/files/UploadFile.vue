<script setup>
import { ref } from 'vue'
import axios from 'axios'
const formData = new FormData()

formData.append('action', 'upload')
formData.append('tenant_id', 'showcase')
formData.append('category', 'staff_photo')
formData.append('created_by', 'admin')
formData.append('file', file)

const res = await axios.post('/api/file_api.php', formData)
</script>

<template>
  <div>
    <input type="file" @change="handleFileChange" />
  </div>
</template>
