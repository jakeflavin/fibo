import { Copy } from 'lucide-react'
import { Modal } from './Modal'
import { useToast } from './Toast'

/**
 * Setup instructions for the remote MCP endpoint: connect once and
 * Claude (Code / Desktop / claude.ai) can create fibo sessions, append
 * stories, and read results — no fibo account involved.
 */
export function ConnectClaudeModal({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  // The endpoint sits under the app's own base, so it moves with it.
  const url = `${window.location.origin}${import.meta.env.BASE_URL}mcp`
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
    <Modal title="Connect Claude" onClose={onClose} className="connect-modal">
        <p className="panel-body">
          Add fibo as a connector once, and Claude can start sessions from your backlog, add stories
          mid-meeting, and read the points back out — no account needed.
        </p>

        <div className="connect-row">
          <span className="field-label">Connector URL — Claude Desktop &amp; claude.ai</span>
          <div className="connect-copy">
            <code className="share-url">{url}</code>
            <button className="btn btn-icon" onClick={copy(url, 'URL')} aria-label="Copy the URL">
              <Copy size={14} />
            </button>
          </div>
          <p className="panel-hint dim">
            Settings → Connectors → Add custom connector → paste the URL.
          </p>
        </div>

        <div className="connect-row">
          <span className="field-label">Claude Code — one command</span>
          <div className="connect-copy">
            <code className="share-url">{command}</code>
            <button
              className="btn btn-icon"
              onClick={copy(command, 'Command')}
              aria-label="Copy the command"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <p className="panel-hint dim">
          Claude gets four tools: create a session, add stories, read the room, and read results.
          Whoever opens a Claude-created session first becomes its admin.
        </p>
    </Modal>
  )
}
