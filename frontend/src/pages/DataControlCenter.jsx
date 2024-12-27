import { batch, useSignal } from '@preact/signals-react';
import { events } from '../events';
import { formatItemNames, usePostRequest } from '../utils';
import HeaderWithIcon from '../components/HeaderWithIcon';
import CustomSelect from '../components/CustomSelect';
import Bubbles from '../components/Bubbles';
import Form from '../components/Form';

export default function DataControlCenter({ user }) {
    const output = useSignal([])
    const eventName = useSignal('Any')
    const activeProcess = useSignal(null)
    const showUpdateStickerApplicationNumbersModal = useSignal(false)

    const getVariantsOfItemType = (_eventName, type) => {
        if (type == 'Patch') return ['Paper', 'Gold']
        else if (['2020 RMR', 'Stockholm 2021'].includes(_eventName)) {
            if (type == 'Sticker') return ['Paper', 'Holo', 'Foil', 'Gold']
            else if (type == 'Autograph') return ['Paper', 'Holo', 'Gold']
        }
        else return ['Paper', 'Glitter', 'Holo', 'Gold']
    }

    const updateEventItems = async () => {
        if (eventName.value == 'Any') return;

        batch(() => {
            activeProcess.value = 'update-event-items'
            output.value = [{ msg: `${eventName.value} items are being updated...` }]
        })

        const event = events.find(event => event.name == eventName)
        const itemTypes = Object.keys(event.items)

        for (let i in itemTypes) {
            const type = itemTypes[i]

            if (event.type == 'tournament' && ['Sticker', 'Autograph', 'Patch'].includes(type)) {
                const variants = getVariantsOfItemType(eventName.value, type)

                for (let j in variants) {
                    const variant = variants[j]

                    output.value = [...output.value, { msg: `Updating ${type} ${variant}...` }]
                    let response = await usePostRequest('update-event-item', { userId: user.value._id, token: document.cookie, eventName: eventName.value, type, variant })
                    output.value = [...output.value.slice(0, -1), { success: response.success, msg: response.success ? `${type} ${variant} was successfully updated.` : (response.msg || `Failed to update ${type} ${variant}.`) }]
                    if (!response.success) return activeProcess.value = null
                }
            }
            else {
                output.value = [...output.value, { msg: `Updating ${type}...` }]
                let response = await usePostRequest('update-event-item', { userId: user.value._id, token: document.cookie, eventName: eventName.value, type, variant: null })
                output.value = [...output.value.slice(0, -1), { success: response.success, msg: response.success ? `${type} was successfully updated.` : (response.msg || `Failed to update ${type} ${variant}.`) }]
                if (!response.success) return activeProcess.value = null
            }
        }

        batch(() => {
            output.value = [...output.value, { success: true, msg: `${eventName.value} items have been updated successfully.` }]
            activeProcess.value = null
        })
    }

    const OutputSection = () => {
        return (
            <div className="output-section">
                <div className="output-section-header">
                    <i className="fa-solid fa-terminal" />
                    <span>Output</span>
                </div>
                <div className="output-section-body">
                    {output.value.map((outputItem, outputItemIndex) =>
                        <span className={"output-row" + (outputItem.success == true ? ' green' : outputItem.success == false ? 'red' : '')} key={outputItemIndex}>{outputItem.msg}</span>
                    )}
                </div>
            </div>
        )
    }

    const UpdateStickerApplicationNumbersModal = () => {
        const tournamentName = useSignal('Any')
        const variant = useSignal('Any')
        const updateStickerApplicationNumbersFormMsg = useSignal(null)

        const updateStickerApplicationNumbers = async (e) => {
            let formValues = Object.fromEntries(new FormData(e.target).entries())

            const response = await usePostRequest('update-sticker-application-numbers', { userId: user.value._id, token: document.cookie, eventName: tournamentName.value, variant: variant.value, formValues })
            if (!response.success) return updateStickerApplicationNumbersFormMsg.value = response.msg

            e.target.reset()
            batch(() => {
                tournamentName.value = 'Any'
                variant.value = 'Any'
                updateStickerApplicationNumbersFormMsg.value = null
                showUpdateStickerApplicationNumbersModal.value = false
            })
        }

        if (!showUpdateStickerApplicationNumbersModal.value) return null

        return (
            <div className="modal-backdrop">
                <div className="modal-container container">
                    <div className="update-sticker-application-numbers-modal modal">
                        <div className="modal-header">
                            <HeaderWithIcon title="Update Sticker Application Numbers" iconClass="fa-regular fa-note-sticky" size="medium" />
                            <CustomSelect title="Tournament Name" state={tournamentName} options={['Shanghai 2024', 'Copenhagen 2024']} />
                            <CustomSelect title="Variant" state={variant} options={['Glitter', 'Holo']} />
                            <i className="close-btn fa-solid fa-xmark" onClick={() => showUpdateStickerApplicationNumbersModal.value = false} />
                        </div>
                        <div className="modal-body">
                            {(tournamentName.value != 'Any' && variant.value != 'Any') &&
                                <Form submitFunction={updateStickerApplicationNumbers} formMsgState={updateStickerApplicationNumbersFormMsg} submitBtnInnerText='Update'
                                    fields={[{
                                        align: 'row',
                                        fields: formatItemNames(events.find(event => event.name == tournamentName.value), 'Sticker', variant.value).map(sticker => { return { name: sticker, type: 'number' } })
                                    }]} />
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="data-control-center-page container">
            <header>
                <HeaderWithIcon title="Data Control Center" iconClass="fa-solid fa-database" />
            </header>
            <section>
                <div className="section-items">
                    <div className="section-item">
                        <HeaderWithIcon title="Update Event Items" iconClass="fa-solid fa-table-list" size="medium" />
                        <CustomSelect title="Event Name" state={eventName} options={events.map(event => event.name)} />
                        <button className="btn animated-btn" disabled={activeProcess.value == 'update-event-items'} onClick={() => updateEventItems()}>
                            <span>Update</span>
                            <Bubbles />
                        </button>
                    </div>
                    <button className="btn-secondary" onClick={() => showUpdateStickerApplicationNumbersModal.value = true}>
                        <i className="fa-regular fa-note-sticky" />
                        <span>Update Sticker Application Numbers</span>
                        <i className="fa-solid fa-chevron-right" />
                    </button>
                </div>

                <OutputSection />
            </section>
            <UpdateStickerApplicationNumbersModal />
        </div>
    )
}