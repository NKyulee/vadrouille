import { Button, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import './ConfirmDialog.scss'

interface ConfirmDialogProps {
  ouvert: boolean
  onOuvertChange: (ouvert: boolean) => void
  titre: string
  texte: string
  /** Précision facultative affichée en avertissement. */
  avertissement?: string
  libelleConfirmer: string
  libelleAnnuler: string
  onConfirmer: () => void
}

/* Confirmation avant une action destructrice.

   React Aria s'occupe de tout ce qui est facile à rater à la main :
   role="alertdialog", piégeage du focus dans la boîte, focus rendu au
   déclencheur à la fermeture, Échap, inertie du reste de la page. */
export default function ConfirmDialog({
  ouvert,
  onOuvertChange,
  titre,
  texte,
  avertissement,
  libelleConfirmer,
  libelleAnnuler,
  onConfirmer,
}: ConfirmDialogProps) {
  return (
    <ModalOverlay className="voile" isOpen={ouvert} onOpenChange={onOuvertChange} isDismissable>
      <Modal className="boite">
        <Dialog className="boite__contenu" role="alertdialog">
          {({ close }) => (
            <>
              <Heading slot="title" className="boite__titre">
                {titre}
              </Heading>
              <p>{texte}</p>
              {avertissement ? <p className="boite__avertissement">{avertissement}</p> : null}
              <div className="boite__actions">
                {/* L'annulation d'abord dans le DOM : c'est elle qui reçoit le
                    focus à l'ouverture, pas l'action destructrice. */}
                <Button className="bouton bouton--discret" onPress={close} autoFocus>
                  {libelleAnnuler}
                </Button>
                <Button
                  className="bouton bouton--danger"
                  onPress={() => {
                    onConfirmer()
                    close()
                  }}
                >
                  {libelleConfirmer}
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
