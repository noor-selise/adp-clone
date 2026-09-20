type BlockingScriptProps = {
  id: string
  html: string
}

export const BlockingScript = ({ id, html }: BlockingScriptProps) => (
  <script id={id} dangerouslySetInnerHTML={{ __html: html }} />
)
