import { batch, useSignal } from "@preact/signals-react"
import { useEffect } from "react"

export default function LineChart({ data, headerText, valueKey, horizontalAreaKey, toolTipKeys, dataSliceOptions }) {
    const verticalPoints = useSignal([])
    const processedData = useSignal([])
    const chartLineStyles = useSignal([])
    const toolTip = useSignal(-1)
    const selectedSliceNumber = useSignal(0)

    const headerBg = '#324372'
    const bodyBg = '#1f2a48'
    const toolTipBg = '#405691'
    const dotBg = '#066edd'
    const backLineColor = '#2b3b69'
    const fontColor = '#fff'
    const buttonBg = '#066edd'

    const lineChartHandler = () => {
        let sortedData = data.slice(selectedSliceNumber, data.length).sort((a, b) => b[valueKey] - a[valueKey])
        let _processedData = JSON.parse(JSON.stringify(data.slice(selectedSliceNumber, data.length)))

        let difference = Math.ceil(((sortedData[0][valueKey] - sortedData[sortedData.length - 1][valueKey]) / 5) / 10) * 10
        let _verticalPoints = [...new Array(7)].map((_, index) => sortedData[sortedData.length - 1][valueKey] + ((index - 1) * difference)).reverse()

        _processedData.map((item, index) => {
            item.distanceFromBottom = ((item[valueKey] - _verticalPoints[_verticalPoints.length - 1]) / (_verticalPoints[0] - _verticalPoints[_verticalPoints.length - 1])) * 100
            item.distanceFromLeft = ((100 / _processedData.length) * index) + ((100 / _processedData.length) * 0.5)
        })

        let chartWidth = +document.getElementById('chart').getBoundingClientRect().width.toFixed(2)
        let chartHeight = +document.getElementById('chart').getBoundingClientRect().height.toFixed(2)

        let _chartLineStyles = []
        for (let i = 0; i < _processedData.length - 1; i++) {
            let verticalSideLength = chartHeight * ((_processedData[i].distanceFromBottom - _processedData[i + 1].distanceFromBottom) * 0.01)
            let horizontalSideLength = chartWidth / _processedData.length
            let hipotenus = Math.sqrt(verticalSideLength * verticalSideLength + horizontalSideLength * horizontalSideLength)

            // degree : dikey kenar / hipotenüsün arcsin'i alınır  = arcsin(dikey kenar/ hipotenüs) * 180/pi
            _chartLineStyles.push({
                degree: Math.asin(verticalSideLength / hipotenus) * (180 / Math.PI),
                hipotenus: hipotenus,
                distanceFromBottom: _processedData[i].distanceFromBottom,
                distanceFromLeft: ((100 / _processedData.length) * i) + ((100 / _processedData.length) * 0.5)
            })
        }

        batch(() => {
            verticalPoints.value = _verticalPoints
            processedData.value = _processedData
            chartLineStyles.value = _chartLineStyles
        })
    }

    useEffect(() => {
        lineChartHandler()

        window.addEventListener('resize', lineChartHandler)
        return () => window.removeEventListener('resize', lineChartHandler)
    }, [])


    return (
        <div id="line-chart" className="line-chart" style={{ color: fontColor }}>
            <div className="chart-header" style={{ background: headerBg }}>
                <span>{headerText}</span>
                <div className="buttons">
                    {dataSliceOptions.map((item, index) =>
                        <button onClick={() => { selectedSliceNumber.value = -item; lineChartHandler() }} style={{ color: fontColor, background: buttonBg }} key={index}>{item}</button>
                    )}
                    <button onClick={() => { selectedSliceNumber.value = 0; lineChartHandler() }} style={{ color: fontColor, background: buttonBg }}>All</button>
                </div>
            </div>
            <div className="chart-body" style={{ background: bodyBg }}>
                <div className="vertical-points">
                    {verticalPoints.value.map((item, index) =>
                        <div className="vertical-points-item" key={index}>
                            <span>{item}</span>
                        </div>
                    )}
                </div>
                <div id="chart" className="chart">
                    {processedData.value.map((item, index) =>
                        <div className="dot" style={{ bottom: item.distanceFromBottom + '%', left: item.distanceFromLeft + '%', background: dotBg }} key={index}>
                            <div className="dot-children"
                                onMouseOver={(e) => { toolTip.value = index; e.target.style.background = dotBg }}
                                onMouseLeave={(e) => { toolTip.value = -1; e.target.style.background = 'transparent' }} />
                        </div>
                    )}
                    {toolTip != -1 &&
                        <div className="tool-tip"
                            style={{
                                bottom: processedData.value[toolTip].distanceFromBottom + '%',
                                left: processedData.value[toolTip].distanceFromLeft + '%',
                                background: toolTipBg,
                                transform: toolTip < processedData.value.length / 2 ? 'translate(2px, calc(100% + 2px))' : 'translate(-100%, calc(100% + 2px))'
                            }}>
                            {toolTipKeys.map((item, index) =>
                                <div className="tool-tip-item" key={index}>
                                    <span>{[item]}</span>
                                    <span>{processedData.value[toolTip][item]}</span>
                                </div>
                            )}
                        </div>
                    }
                    {chartLineStyles.value.map((item, index) =>
                        <span
                            className="chart-line"
                            style={{
                                bottom: item.distanceFromBottom + '%',
                                left: item.distanceFromLeft + '%',
                                width: item.hipotenus + 'px',
                                background: dotBg,
                                transform: `rotate(${item.degree}deg)`
                            }}
                            key={index}
                        />
                    )}
                    <div className="horizontal-back-lines">
                        {[...new Array(6)].map((_, index) => <span style={{ borderColor: backLineColor }} key={index} />)}
                    </div>
                    <div className="vertical-back-lines">
                        {[...new Array(6)].map((_, index) => <span style={{ borderColor: backLineColor }} key={index} />)}
                    </div>
                </div>
            </div>
            <div className="chart-footer-wrapper" style={{ background: bodyBg }}>
                <div className="chart-footer">
                    {processedData.value.map((item, index) =>
                        <span style={{
                            width: (100 / processedData.value.length) + '%',
                            visibility: ((index != processedData.value.length - 1) && (index % Math.floor(processedData.value.length / 5) == 0)) ? 'visible' : 'hidden'
                        }} key={index}>
                            {item[horizontalAreaKey]}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}