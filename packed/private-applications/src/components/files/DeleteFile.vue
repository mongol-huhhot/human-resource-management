<script setup>
import { ref } from 'vue'
import axios from 'axios'

const formData = new FormData()
formData.append('action', 'soft_delete')
formData.append('file_uuid', fileUuid)
formData.append('deleted_by', 'admin')

await axios.post('/api/file_api.php', formData)
</script>

<template> 
    <div>
        <input type="file" @change="handleFileChange" />
    </div>
</template>
