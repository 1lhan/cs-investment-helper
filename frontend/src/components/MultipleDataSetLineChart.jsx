import { batch, useSignal } from "@preact/signals-react"
import { useEffect } from "react"

export default function MultipleDataSetLineChart({ data, headerText, valueKey, horizontalAreaKey, toolTipKeys, dataSliceOptions, colors }) {
    const processedData = useSignal([])
    const selectedSliceNumber = useSignal(0)
    const lineChartData = useSignal(false) // object { data: [], verticalPoints: [], chartLineStyles: [] }
    const toolTip = useSignal(-1)

    const headerBg = '#324372'
    const bodyBg = '#1f2a48'
    const toolTipBg = '#405691'
    const dotBg = '#066edd'
    const backLineColor = '#2b3b69'
    const fontColor = '#fff'
    const buttonBg = '#066edd'

    const lineChartHandler = () => {
        let _lineChartData = { data: [], verticalPoints: [], chartLineStyles: [] }

        for (let i in data) {
            _lineChartData.data = JSON.parse(JSON.stringify(data.slice(selectedSliceNumber, data.length)))
            let sortedData = data[i].slice(selectedSliceNumber, data[i].length).sort((a, b) => b[valueKey] - a[valueKey])
            let difference = +((sortedData[0][valueKey] - sortedData[sortedData.length - 1][valueKey]) / 5).toFixed(3) * 1.25
            let _verticalPoints = { top: sortedData[sortedData.length - 1][valueKey] + (5 * difference), bottom: sortedData[sortedData.length - 1][valueKey] + (-1 * difference) }
            _lineChartData.verticalPoints.push(_verticalPoints)
        }

        for (let i in _lineChartData.data) {
            _lineChartData.data[i].map((item, index) => {
                item.distanceFromBottom = ((item[valueKey] - _lineChartData.verticalPoints[i].bottom) / (_lineChartData.verticalPoints[i].top - _lineChartData.verticalPoints[i].bottom)) * 100
                item.distanceFromLeft = ((100 / _lineChartData.data[i].length) * index) + ((100 / _lineChartData.data[i].length) * 0.5)
            })
        }

        let chartWidth = +document.getElementById('chart').getBoundingClientRect().width.toFixed(2)
        let chartHeight = +document.getElementById('chart').getBoundingClientRect().height.toFixed(2)

        for (let i in _lineChartData.data) {
            _lineChartData.chartLineStyles.push([])
            for (let j = 0; j < _lineChartData.data[i].length - 1; j++) {
                let verticalSideLength = chartHeight * ((_lineChartData.data[i][j].distanceFromBottom - _lineChartData.data[i][j + 1].distanceFromBottom) * 0.01)
                let horizontalSideLength = chartWidth / _lineChartData.data[i].length
                let hipotenus = Math.sqrt(verticalSideLength * verticalSideLength + horizontalSideLength * horizontalSideLength)

                // degree : dikey kenar / hipotenüsün arcsin'i alınır  = arcsin(dikey kenar/ hipotenüs) * 180/pi
                _lineChartData.chartLineStyles[i].push({
                    degree: Math.asin(verticalSideLength / hipotenus) * (180 / Math.PI),
                    hipotenus: hipotenus,
                    distanceFromBottom: _lineChartData.data[i][j].distanceFromBottom,
                    distanceFromLeft: ((100 / _lineChartData.data[i].length) * j) + ((100 / _lineChartData.data[i].length) * 0.5)
                })
            }
        }
        console.log(_lineChartData)
        lineChartData.value = _lineChartData
    }

    const onHoverValueColumn = (index) => {
        for (let i = 0; i < data.length; i++) {
            document.getElementById(`dot-children-${valueKey}-${i}-${index}`).style.background = colors[i]
        }
    }

    const onMouseLeaveValueColumn = (index) => {
        for (let i = 0; i < data.length; i++) {
            document.getElementById(`dot-children-${valueKey}-${i}-${index}`).style.background = 'transparent'
        }
    }

    useEffect(() => {
        lineChartHandler()

        window.addEventListener('resize', lineChartHandler)
        return () => window.removeEventListener('resize', lineChartHandler)
    }, [])


    return (
        <div id="multiple-data-set-line-chart" className="multiple-data-set-line-chart" style={{ color: fontColor }}>
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
                <div id="chart" className="chart">
                    {lineChartData.value && lineChartData.value.data.map((item, index) =>
                        lineChartData.value.data[index].map((item2, index2) =>
                            <div className="dot" id={index} style={{ bottom: item2.distanceFromBottom + '%', left: item2.distanceFromLeft + '%', background: colors[index] }} key={index2}>
                                <div className="dot-children" id={`dot-children-${valueKey}-${index}-${index2}`} />
                            </div>
                        )
                    )}
                    {lineChartData.value && lineChartData.value.data[0].map((item, index) =>
                        <div className="chart-value-columns" style={{ width: (100 / lineChartData.value.data[0].length) + '%' }} key={index}
                            onMouseOver={(e) => { toolTip.value = index; onHoverValueColumn(index) }}
                            onMouseLeave={(e) => { toolTip.value = -1; onMouseLeaveValueColumn(index) }} />
                    )}
                    {toolTip != -1 &&
                        <div className="tool-tip"
                            style={{
                                top: '100%',
                                left: (((100 / lineChartData.value.data[0].length) / 2) + ((100 / lineChartData.value.data[0].length) * toolTip)) + '%',
                                background: toolTipBg,
                                transform: 'translateX(-50%)'
                            }}>
                            <div className="tool-tip-item">
                                <span>{horizontalAreaKey}</span>
                                <span>{lineChartData.value.data[0][toolTip][horizontalAreaKey]}</span>
                            </div>
                            {lineChartData.value.data.map((dataSet, dataSetIndex) =>
                                <div className="tool-tip-item" key={dataSetIndex}>
                                    <span>{toolTipKeys[dataSetIndex]}</span>
                                    <span>{lineChartData.value.data[dataSetIndex][toolTip][valueKey]}</span>
                                </div>
                            )}
                        </div>
                    }
                    {lineChartData.value && lineChartData.value.chartLineStyles.map((item, index) =>
                        lineChartData.value.chartLineStyles[index].map((item2, index2) =>
                            <span
                                className="chart-line"
                                id={index}
                                style={{
                                    bottom: item2.distanceFromBottom + '%',
                                    left: item2.distanceFromLeft + '%',
                                    width: item2.hipotenus + 'px',
                                    background: colors[index],
                                    transform: `rotate(${item2.degree}deg)`,
                                }}
                                key={index2}
                            />
                        )
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
                            visibility: ((index != processedData.value.length - 1) && (index % Math.floor(processedData.value.length / 5) == 0)) || index < 7 ? 'visible' : 'hidden'
                        }} key={index}>
                            {item[horizontalAreaKey]}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}