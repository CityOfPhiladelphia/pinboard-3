<!-- ABOUTME: Root component. Wraps every route in PinboardShell chrome inside a
     phila .content region and supplies the header's nav links and CTAs. -->
<script setup lang="ts">
import { PinboardShell } from '@pinboard/ui'
import type { NavLink } from '@phila/phila-ui-app-header'
import '@pinboard/ui/style.css'
import '@/assets/a11y.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { Callout } from '@phila/phila-ui-callout'
import { ModalTarget } from '@phila/phila-ui-modal'
import { useAuth } from '@phila/sso-vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountProvisioning } from '@/composables/useAccountProvisioning'
import ReportIssueIcon from '@/components/ReportIssueIcon'

const route = useRoute()
const { signIn, signOut, isAuthenticated, userName } = useAuth()
const {
  status: accountStatus,
  errorMessage: accountError,
  retry: retryAccountProvisioning,
} = useAccountProvisioning()

// Marks a nav link selected when its href matches the current route, exactly
// or as a path prefix (so e.g. "/answers" stays selected on "/answers/123").
// "/" is exempt from prefix matching or it would match every route.
const isSelectedHref = (href?: string) =>
  href !== undefined && (href === route.path || (href !== '/' && route.path.startsWith(`${href}/`)))

const navLinks = computed(
  () =>
    [
      {
        text: 'Report an issue',
        href: '/report',
        icon: ReportIssueIcon,
        iconSize: 'medium' as const,
      },
      { text: 'Map', href: '/' },
      { text: 'Requests', href: '/reports' },
      { text: 'Answers', href: '/answers' },
      ...(isAuthenticated.value
        ? [
            { text: userName.value ?? '' },
            { text: 'Sign out', href: '#', onClick: () => signOut() },
          ]
        : [{ text: 'Login / Sign up', href: '#', onClick: () => login() }]),
    ].map((link) => ({ ...link, selected: isSelectedHref(link.href) })) as NavLink[],
)

const feedbackHref = 'https://www.phila.gov/feedback/'

// Mirrors authGuard's redirect mechanism (router/index.ts) so a header-initiated
// login returns the user to where they clicked from, not '/' or a stale guard redirect.
function login() {
  sessionStorage.setItem('auth:redirectTo', route.fullPath)
  signIn()
}
</script>

<template>
  <PinboardShell
    title="Philly 311"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Philly311',
      href: '/',
    }"
    :links="navLinks"
    :translations="false"
    :show-header-tooltip="false"
    :feedback-href="feedbackHref"
  >
    <div class="content app-content">
      <div v-if="accountStatus === 'pending'" class="account-provisioning-gate" role="status">
        <span class="spinner" aria-hidden="true" />
        <span class="sr-only">Logging in…</span>
      </div>
      <Callout
        v-else-if="accountStatus === 'error'"
        class="account-provisioning-gate"
        type="error"
        role="alert"
        :message="`Couldn't log you in: ${accountError}`"
      >
        <PhilaButton variant="secondary" type="button" @click="retryAccountProvisioning()">
          Try again
        </PhilaButton>
      </Callout>
      <RouterView v-else />
    </div>
  </PinboardShell>
  <ModalTarget />
</template>

<style scoped>
/* Pass-through wrapper: applies phila .content typography to routed pages
   without introducing a layout box that would break the full-height map. */
.app-content {
  display: contents;
}

.account-provisioning-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--spacing-m, 1rem);
  box-sizing: border-box;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--Schemes-Border-low, #e3e3e3);
  border-top-color: var(--Schemes-Primary, #002855);
  border-radius: 50%;
  animation: spinner-rotate 0.8s linear infinite;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

/* @phila/phila-ui-modal's own .overlay/.phila-modal ship with no z-index at
 * all (z-index: auto), so with no explicit stacking order they render behind
 * PinboardShell's own fixed, z-index:100 info scrim (and anything else in the
 * app's chrome that sets a z-index) — the modal opens but is invisible,
 * hidden behind the page. :global() reaches Modal.vue's markup, which is
 * teleported here (into <ModalTarget/>'s target div) with Modal's own scope,
 * not this component's — a scoped selector without it wouldn't match.
 * "overlay"/"phila-modal" aren't used by any other installed phila-ui-*
 * package, so this is safe as a true global rule.
 *
 * 999/1000 (the first values tried) cleared the info scrim but not
 * everything: @phila/phila-ui-app-header's own header bar is
 * position:sticky;z-index:9999 (its "is-sticky-desktop" class), its nav
 * flyout/language menu go up to 10000, and its tooltip positioner is
 * 10010 — all from @pinboard/ui's bundled CSS (dist/ui.css). 20000 clears
 * all of those with headroom for anything else already in that stylesheet. */
:global(.overlay) {
  z-index: 19999;
}
:global(.phila-modal) {
  z-index: 20000;
}
/* Another @phila/phila-ui-modal gap: nothing in the modal caps its height or
 * scrolls when content is taller than the viewport — it's centered via
 * top:50%+translate with an unconstrained height, so tall content just grows
 * the box past the top and bottom of the screen (above the top is where it
 * visually collided with the app header), with no way to scroll to the rest.
 * .phila-modal itself has no background/border-radius of its own — the
 * visible white rounded card is BaseCard's .phila-card, one level in — but
 * putting the scrollbar directly on .phila-card doesn't work either: a
 * native scrollbar on the same element as border-radius doesn't reliably
 * respect that rounding at the corner it sits in, so it visibly pokes past
 * the curve. .phila-card stays a plain overflow:hidden clipping mask (its
 * rounding + shadow untouched); the actual capped/scrollable box moves one
 * level in. .phila-card is BaseCard's general-purpose class used by many
 * unrelated cards app-wide, so it's scoped to only the instance that's a
 * descendant of .phila-modal. */
:global(.phila-modal .phila-card) {
  max-height: calc(100dvh - 4rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 !important;
}
/* The close button/title (header) and Cancel/Apply (actions) should stay
 * pinned on screen — only the middle content should scroll. That boundary
 * doesn't line up with any one existing wrapper, so getting there means
 * fixing up three levels:
 *
 * .phila-card__inner (BaseCard's flex child, general-purpose like
 * .phila-card above, same scoping) needs to actually be bounded/shrinkable
 * within .phila-card's capped height, but no longer scrolls itself — that
 * moves to .modal-content below.
 *
 * Between it and header/content/actions sits Modal.vue's own FocusTrap,
 * wrapping all three. FocusTrap (@phila/phila-ui-core) renders as whatever
 * tag its `as` prop names, defaulting to a plain, unstyled <span> when
 * omitted — which Modal.vue does. An inline span isn't a flex container,
 * so despite living inside a flex-column ancestor, it doesn't distribute
 * space among header/content/actions at all — fine when the whole thing
 * scrolled as one block above, not fine for pinning two of the three.
 * Making it a flex column itself (and letting it actually grow to fill the
 * available height) is what lets .modal-content, alone among its siblings,
 * claim the remaining space and scroll. There's no class here to hang this
 * off, so this depends on FocusTrap always rendering as a bare <span> in
 * this position — true for the installed version, but something a
 * @phila/phila-ui-core upgrade could silently break.
 *
 * .modal-content becomes the actual scroll container. Padding used to live
 * on .phila-card__inner, wrapping header/content/actions as one inset
 * group; now that .modal-content scrolls on its own, that same "padding on
 * the scroll container puts its scrollbar outside the visible edge"
 * problem from before would just reappear one level in — so .modal-content
 * itself stays padding-free (scrollbar flush with the card's edge), and the
 * horizontal inset for its content instead lives on VisibilityContactModal's
 * own .vc-modal, which is that content and already under our control.
 * .modal-header/.modal-actions, which don't scroll, get plain padding
 * directly since the scrollbar-inset problem doesn't apply to them. */
:global(.phila-modal .phila-card__inner) {
  flex: 1 1 auto;
  min-height: 0;
}
:global(.phila-modal .is-flex.is-flex-column.is-flex-1 > span) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
/* Figma specs 32px (spacing/xl) padding around the whole dialog — the
 * previous pass flagged that Modal.vue's own p-4 utility gives 24px
 * instead, but left it alone as a package-level gap since fixing it meant
 * touching padding this file didn't otherwise need to. Now that this
 * restructuring already has to give .modal-header/.modal-actions their own
 * padding from scratch, matching Figma's real 32px here (and in .vc-modal's
 * own horizontal padding below) costs nothing extra and closes that gap. */
:global(.phila-modal .modal-header) {
  padding: var(--spacing-xl, 2rem) var(--spacing-xl, 2rem) 0 var(--spacing-xl, 2rem);
}
:global(.phila-modal .modal-content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
:global(.phila-modal .modal-actions) {
  padding: 0 var(--spacing-xl, 2rem) var(--spacing-xl, 2rem) var(--spacing-xl, 2rem);
}
/* Modal.vue's title (the `title` prop) renders with a "has-text-label-3xl"
 * utility class — Label/3XL, not the Subtitle/Subtitle-1 style Figma
 * actually specs for a dialog title (24px/36px). Label/3XL is 36px at the
 * root and grows to 40px/48px-line-height under phila-ui-core's own
 * desktop (min-width:960px) override, so the title renders far larger than
 * Figma's design. !important since the utility class sets its own. */
:global(.phila-modal .has-text-label-3xl) {
  font-size: var(--Subtitle-Subtitle-1-font-subtitle-1-size, 1.5rem) !important;
  line-height: var(--Subtitle-Subtitle-1-font-subtitle-1-lineheight, 2.25rem) !important;
}
</style>
