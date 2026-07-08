'use client'

import { useRef } from 'react'

export function InfoDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button
        type="button"
        className="info-trigger"
        onClick={() => dialog.current?.showModal()}
      >
        Why do I need to log in?
      </button>
      <dialog
        ref={dialog}
        className="info-dialog"
        aria-labelledby="loginInfoTitle"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <div className="dialog-shell">
          <div className="dialog-header">
            <p className="node-label">Access note: permissions</p>
            <button
              type="button"
              className="dialog-close"
              aria-label="Close"
              onClick={() => dialog.current?.close()}
            >
              ×
            </button>
          </div>
          <h2 id="loginInfoTitle">TL;DR: how else would we know?</h2>
          <p>
            Discord has the server list. We ask Discord, count the list, show
            the number. Wicked elaborate, I know.
          </p>
          <p>
            The login asks for your basic profile and server list. It does not
            ask for your password, messages, billing info, or permission to
            rearrange your life.
          </p>
          <p>
            No account database. No secret filing cabinet in the back. Just an
            encrypted session so the result page can load.
          </p>
        </div>
      </dialog>
    </>
  )
}
