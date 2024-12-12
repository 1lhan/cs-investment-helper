import { batch, useSignal } from '@preact/signals-react'
import { itemNameConverter, usePostRequest } from '../utils'
import { events } from '../events'
import CustomSelect from '../components/CustomSelect'
import Form from '../components/Form'

export default function DataControlCenter({ user }) {
    const eventName = useSignal('Any')
    const output = useSignal([])
    const green = '#34d399';
    const red = '#ff6c6c';

    const showStickerApplicationNumbersForm = useSignal(false)

    const itemVariants = [
        [
            ['Paper', 'Glitter', 'Holo', 'Gold'],
            [
                'Shanghai 2024 sticker', 'Shanghai 2024 autograph', 'Copenhagen 2024 sticker', 'Copenhagen 2024 autograph', 'Paris 2023 sticker', 'Paris 2023 autograph', 'Rio 2022 sticker', 'Rio 2022 autograph',
                'Antwerp 2022 sticker', 'Antwerp 2022 autograph',
            ]
        ],
        [['Paper', 'Holo', 'Foil', 'Gold'], ['Stockholm 2021 sticker', '2020 RMR sticker']],
        [['Paper', 'Gold'], ['Stockholm 2021 patch']],
        [['Paper', 'Holo', 'Gold'], ['Stockholm 2021 autograph']]
    ]

    const updateEventItems = async () => {
        let _event = events.find(event => event.name == eventName.value)
        let itemTypes = Object.keys(_event.items)

        output.value = [...output.value, { msg: `${eventName.value} items data have been updating...` }]

        for (let i in itemTypes) {
            let type = itemTypes[i]

            if (_event.type == 'tournament' && ['sticker', 'autograph', 'patch'].includes(type)) {
                let variants = itemVariants.find(item => item[1].find(item2 => item2 == `${_event.name} ${type}`))[0]

                for (let j in variants) {
                    let variant = variants[j]
                    output.value = [...output.value, { msg: `${type} ${variant} updating...` }]

                    let response = await usePostRequest('/update-event-item', { eventName: _event.name, type, variant })
                    output.value = [...output.value.slice(0, -1), { success: response.success, msg: response.success ? (`${type} ${variant} updated.`) : (response.msg || `${response.msg} (${type} ${variant})`) }]
                    if (!response.success) return;
                }
            }
            else {
                output.value = [...output.value, { msg: `${type} updating...` }]

                let response = await usePostRequest('/update-event-item', { eventName: _event.name, type, variant: null })
                output.value = [...output.value.slice(0, -1), { success: response.success, msg: response.success ? `${type} updated.` : (response.msg || `${response.msg} (${type})`) }]
                if (!response.success) return;
            }
        }
        output.value = [...output.value, { success: true, msg: `${eventName.value} items data have been updated.` }]
    }

    const StickerApplicationNumbersForm = () => {
        const tournamentName = useSignal('Any')
        const variant = useSignal('Any')
        const formMsg = useSignal(null)

        const updateStickerApplicationNumbers = async (e) => {
            let formValues = Object.fromEntries(new FormData(e.target).entries())

            const response = await usePostRequest('/update-sticker-application-numbers', { eventName: tournamentName.value, variant: variant.value, formValues })
            if (!response.success) return formMsg.value = response.msg

            e.target.reset()
            batch(() => {
                tournamentName.value = 'Any'
                variant.value = 'Any'
                formMsg.value = response.msg
            })
        }

        if (!showStickerApplicationNumbersForm.value) return;

        return (
            <div className="modal-backdrop">
                <div className="modal-container">
                    <div className="sticker-application-numbers-modal">
                        <div className="modal-header">
                            <div className="page-name">
                                <div className="icon-wrapper">
                                    <i className="fa-regular fa-note-sticky" />
                                </div>
                                <span>Update Sticker Application Numbers</span>
                            </div>
                            <CustomSelect id="tournament-name" title="Tournament Name" state={tournamentName} options={events.filter(event => event.type == 'tournament').map(item => { return item.name })}/>
                            <CustomSelect id="sticker-variant" title="Sticker Variant" state={variant} options={['Glitter', 'Holo']}/>
                            <i className="fa-solid fa-xmark" onClick={() => showStickerApplicationNumbersForm.value = false} />
                        </div>
                        {(tournamentName.value != 'Any' && variant.value != 'Any') &&
                            <Form title="Sticker Application Numbers Form" submitFunction={updateStickerApplicationNumbers} formMsgState={formMsg} submitBtnInnerText="Update Sticker Application Numbers"
                                fields={[{
                                    align: 'row',
                                    fields: itemNameConverter(events.find(event => event.name == tournamentName.value).items.sticker, 'sticker', tournamentName.value, variant.value)
                                        .map(sticker => { return { name: sticker, type: 'number' } })
                                }]}
                            />
                        }
                    </div>
                </div>
            </div>
        )
    }

    const OutputSection = () => {
        return (
            <div className="output-section">
                <h4>
                    <i className="fa-solid fa-terminal" />
                    <span>Output</span>
                </h4>
                {output.value.length > 0 &&
                    <div className="output">
                        {output.value.map((outputItem, outputItemIndex) =>
                            <span className="output-item" style={{ color: outputItem.success ? green : outputItem.success == false ? red : '' }} key={outputItemIndex}>{outputItem.msg}</span>
                        )}
                    </div>
                }
            </div>
        )
    }

    if (user.value?.accountType != 'admin') return <span className="page-msg-box">No Permission</span>

    return (
        <div className="data-control-center-page container">
            <header>
                <div className="page-name">
                    <div className="icon-wrapper">
                        <i className="fa-solid fa-database" />
                    </div>
                    <span>Data Control Center</span>
                </div>
            </header>
            <section>
                <div className="options-section">
                    <div className="options-section-item">
                        <h4>Update Event Items</h4>
                        <CustomSelect id="event-name" title="Event Name" state={eventName} options={events.map(item => { return item.name })} func={null} />
                        <button className="btn" onClick={() => updateEventItems()} disabled={eventName.value == 'Any'}><i className="fa-solid fa-play" /></button>
                    </div>
                    <div className="options-section-item">
                        <button className="btn-secondary" onClick={() => showStickerApplicationNumbersForm.value = true}>
                            <i className="fa-regular fa-note-sticky" />
                            <span>Update Sticker Application Numbers</span>
                            <i className="fa-solid fa-chevron-right" />
                        </button>
                    </div>
                </div>

                <OutputSection />

                <StickerApplicationNumbersForm />
            </section>
        </div>
    )
}