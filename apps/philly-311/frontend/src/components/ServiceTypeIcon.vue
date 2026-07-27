<!-- ABOUTME: Decorative colored disc with the service-type's phila-ui glyph; the
     service-type name is always shown beside it, so the glyph is aria-hidden. -->
<script setup lang="ts">
import { computed } from 'vue'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

const props = withDefaults(defineProps<{ serviceType: string; size?: number }>(), { size: 36 })

const style = computed(() => ({
  backgroundColor: serviceTypeColor(props.serviceType),
  width: `${props.size}px`,
  height: `${props.size}px`,
}))
</script>

<template>
  <span class="service-type-icon" :style="style">
    <component :is="serviceTypeIconComponent(serviceType)" aria-hidden="true" />
  </span>
</template>

<style scoped>
.service-type-icon {
  flex: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
</style>
