<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Logo } from '@phila/phila-ui-logo'
import { PhilaLink } from '@phila/phila-ui-link'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'

const router = useRouter()

const mq = window.matchMedia('(max-width: 768px)')
const isMobile = ref(mq.matches)
const onMqChange = (e: MediaQueryListEvent) => (isMobile.value = e.matches)
mq.addEventListener('change', onMqChange)
onUnmounted(() => mq.removeEventListener('change', onMqChange))
</script>

<template>
  <div class="layout content">
    <div class="inner-container">
      <div class="content-area">
        <div class="section">
          <div class="intro-text-container">
            <PhilaLink href="/" text="Back to map" :icon-definition="faChevronLeft" />
            <h1>Flood information and resources</h1>

            <div class="main-description">
              This map allows residents to keep an eye on water levels in parts of the city and make
              informed decisions prior to, during, and after a flooding event.
            </div>
          </div>

          <div class="content-container">
            <div class="subsection-container">
              <component :is="isMobile ? 'h6' : 'h5'">How to use this data</component>
              This website allows residents to keep an eye on water levels in parts of the city.
              They can use this information and resources to make informed decisions prior to,
              during, and after a flooding event.
            </div>

            <div class="subsection-container">
              <component :is="isMobile ? 'h6' : 'h5'">Why we measure this data</component>
              <div>
                Philadelphia sits between two major rivers: the Delaware River and the Schuylkill
                River. Much of the city lies in low-elevation watershed areas. As a result, large
                volumes of water traveling downstream reach Philadelphia quickly, increasing the
                risk of flooding. Factors such as tidal influence, backflow effects, and strong
                winds can raise river levels and delay natural water drainage.
              </div>
              <div>
                In recent years, the risk of flooding has grown even more. Short, intense rainstorms
                have become more common due to climate change. Warmer air holds more moisture. When
                moisture releases all at once, the city's drainage system can't always withstand the
                surge of water. This leads to rapid surface runoff and street flooding.
              </div>
            </div>
            <div class="subsection-container">
              <component :is="isMobile ? 'h6' : 'h5'">What data is being collected</component>
              Flood gauges and cameras were placed in areas at high risk. They collect a wide range
              of data, including information on water levels, rain amount, flooding risk rates,
              depth, and water temperature. This technology allows us to better watch the condition
              of our floodways.
            </div>
            <div class="subsection-container">
              <component :is="isMobile ? 'h6' : 'h5'"
                >Why are so many gauges and cameras in Eastwick?</component
              >
              <div>
                To better inform residents of flooding, the City established a pilot program for
                Eastwick.
                <a
                  href="https://www.phila.gov/programs/eastwick-from-recovery-to-resilience/resources-for-residents/eastwick-emergency-alerts/"
                >
                  <span>ReadyPhiladelphia: Eastwick Alerts</span>
                </a>
                is a combination of gauge and camera access and emergency alerts. Subscribers are
                updated throughout storm events. This pilot program is Eastwick-based because of the
                impact that consistent flooding has had in the area.
              </div>
            </div>
            <div class="subsection-container">
              <component :is="isMobile ? 'h6' : 'h5'">Resources and key terms</component>
              <ul class="subsection-content" style="margin: 0; padding-left: 1rem">
                <li style="margin: 0">
                  <a href="https://forecast.weather.gov/glossary.php?word=FLOOD">
                    Flood glossary from NOAA's National Weather Service
                  </a>
                </li>
                <li style="margin: 0">
                  <a
                    href="https://www.phila.gov/departments/oem/ready-or-not/how-to-get-ready/natural-hazards/flood/"
                  >
                    How to prepare for flooding, and what to do during and after
                  </a>
                </li>
                <li style="margin: 0">
                  <a
                    href="https://www.phila.gov/programs/eastwick-from-recovery-to-resilience/resources-for-residents/eastwick-emergency-alerts/"
                  >
                    Sign up for emergency alerts
                  </a>
                </li>
                <li style="margin: 0">
                  <a href="https://www.phila.gov/departments/oem/">
                    Office of Emergency Management
                  </a>
                </li>
                <li style="margin: 0">
                  <a href="mailto:oem@phila.gov">Send feedback about this program</a>
                </li>
              </ul>
            </div>

            <div class="subsection-container mobile-footer-links">
              <div class="mobile-footer-heading">
                <Logo bell-only />
                <component :is="isMobile ? 'h6' : 'h5'">About phila.gov</component>
              </div>
              <ul class="subsection-content" style="margin: 0; padding-left: 1rem">
                <li style="margin: 0">
                  <a href="https://www.phila.gov/terms-of-use/">Terms of use</a>
                </li>
                <li style="margin: 0">
                  <a href="https://www.phila.gov/open-records-policy/">Right to know</a>
                </li>
                <li style="margin: 0">
                  <a href="https://www.phila.gov/privacypolicy/">Privacy Policy</a>
                </li>
                <li style="margin: 0">
                  <a href="https://www.phila.gov/accessibility-policy/">Accessibility</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- TODO: jump links component -->
    </div>
  </div>
</template>

<style>
.layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  height: 100%;
  overflow-y: auto;
}

.inner-container {
  display: flex;
  max-width: 80rem;
  gap: 2rem;
  align-self: stretch;
}

.content-area {
  padding: 1.5rem 2rem 0 2rem;
  justify-content: center;
  align-items: center;
}

.section {
  display: flex;
  width: 100%;
  max-width: 45rem;
  padding-bottom: var(--spacing-4xl, 4rem);
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-4xl, 4rem);
}

.intro-text-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-s, 0.75rem);
  align-self: stretch;
}

.content-container {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-3xl, 3rem);
}

.subsection-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs, 0.5rem);
  align-self: stretch;
}

.subsection-content {
  list-style-type: '\2022';
}

.main-description {
  font-weight: 600;
  width: 100%;
}

.mobile-footer-links {
  display: none;
}

.mobile-footer-heading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .content-area {
    padding: 1.5rem 1rem 0 1rem;
  }

  .section {
    gap: var(--spacing-2xl, 2rem);
    padding-bottom: var(--spacing-2xl, 2rem);
  }

  .mobile-footer-links {
    display: flex;
  }
}
</style>
