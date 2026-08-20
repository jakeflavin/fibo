import { Copy } from 'lucide-react'
import { appUrl } from '@/lib/urls'
import { ConnectCopy, ConnectDialog, ConnectRow } from './ConnectClaudeModal.styled'
import { Button, FieldLabel, PanelBody, PanelHint, ShareUrl } from '@/styles/shared.styled'
import { useToast } from './Toast'

/**
 * Setup instructions for the remote MCP endpoint: connect once and
 * Claude (Code / Desktop / claude.ai) can create fibo sessions, append
 * stories, and read results — no fibo account involved.
 */
export function ConnectClaudeModal({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  // The endpoint sits under the app's own base, so it moves with it.
  const url = appUrl('/mcp')
  const command = `claude mcp add --transport http --scope user fibo ${url}`


  const copy = (value: string, what: string) => async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast(`${what} copied`)
    } catch {
      toast('Could not access the clipboard.', 'error')
    }
  }

  /*
   * No portal any more. This modal is opened from menus inside fixed-position wrappers,
   * whose stacking contexts used to trap the backdrop under page content; a dialog opened
   * with showModal() is in the top layer, which no stacking context can contain.
   */
  return (
    <ConnectDialog title="Connect Claude" onClose={onClose}>
        <PanelBody>
          Add fibo as a connector once, and Claude can start sessions from your backlog, add stories
          mid-meeting, and read the points back out — no account needed.
        </PanelBody>

        <ConnectRow>
          <FieldLabel>Connector URL — Claude Desktop &amp; claude.ai</FieldLabel>
          <ConnectCopy>
            <ShareUrl>{url}</ShareUrl>
            <Button $icon  onClick={copy(url, 'URL')} aria-label="Copy the URL">
              <Copy size={14} />
            </Button>
          </ConnectCopy>
          <PanelHint>
            Settings → Connectors → Add custom connector → paste the URL.
          </PanelHint>
        </ConnectRow>

        <ConnectRow>
          <FieldLabel>Claude Code — one command</FieldLabel>
          <ConnectCopy>
            <ShareUrl>{command}</ShareUrl>
            <Button $icon
              
              onClick={copy(command, 'Command')}
              aria-label="Copy the command">
              <Copy size={14} />
            </Button>
          </ConnectCopy>
        </ConnectRow>

        <PanelHint>
          Claude gets four tools: create a session, add stories, read the room, and read results.
          Whoever opens a Claude-created session first becomes its admin.
        </PanelHint>
    </ConnectDialog>
  )
}
