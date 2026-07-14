<script setup>
import { ref } from 'vue'
import axios from 'axios'
const res = await axios.get('/api/file_api.php', {
  params: {
    action: 'preview_url',
    file_uuid: fileUuid
  }
})

window.open(res.data.COMMON.result.url)
</script>

<template> 
    <div>
        <input type="file" @change="handleFileChange" />
    </div>
</template>
