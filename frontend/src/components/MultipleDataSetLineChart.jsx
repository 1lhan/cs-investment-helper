import { useSignal } from "@preact/signals-react"
import { useEffect } from "react"

export default function MultipleDataSetLineChart({ data, title, yKey, xKey, toolTipKeys, dataSliceOptions, colors }) {
    const selectedSliceNumber = useSignal(0)
    const lineChartData = useSignal(false) // object { data: [], verticalPoints: [], chartLineStyles: [] }
    const toolTip = useSignal(-1)

    const lineChartHandler = () => {
        let _lineChartData = { data: [], verticalPoints: [], chartLineStyles: [] }

        for (let i in data) {
            _lineChartData.data = JSON.parse(JSON.stringify(data.slice(selectedSliceNumber, data.length)))
            let sortedData = data[i].slice(selectedSliceNumber, data[i].length).sort((a, b) => b[yKey] - a[yKey])
            let difference = +((sortedData[0][yKey] - sortedData[sortedData.length - 1][yKey]) / 5).toFixed(3) * 1.25
            let _verticalPoints = { top: sortedData[sortedData.length - 1][yKey] + (5 * difference), bottom: sortedData[sortedData.length - 1][yKey] + (-1 * difference) }
            _lineChartData.verticalPoints.push(_verticalPoints)
        }

        for (let i in _lineChartData.data) {
            _lineChartData.data[i].map((item, index) => {
                if (_lineChartData.verticalPoints[i].top - _lineChartData.verticalPoints[i].bottom == 0) item.distanceFromBottom = 50
                else item.distanceFromBottom = ((item[yKey] - _lineChartData.verticalPoints[i].bottom) / (_lineChartData.verticalPoints[i].top - _lineChartData.verticalPoints[i].bottom)) * 100
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

        lineChartData.value = _lineChartData
    }

    const onHoverValueColumn = (index) => {
        for (let i = 0; i < data.length; i++) {
            document.getElementById(`dot-children-${yKey}-${i}-${index}`).style.background = colors[i]
        }
    }

    const onMouseLeaveValueColumn = (index) => {
        for (let i = 0; i < data.length; i++) {
            document.getElementById(`dot-children-${yKey}-${i}-${index}`).style.background = 'transparent'
        }
    }

    const ToolTip = () => {
        return (
            toolTip != -1 &&
            <div className="tool-tip"
                style={{
                    top: '100%',
                    left: (((100 / lineChartData.value.data[0].length) / 2) + ((100 / lineChartData.value.data[0].length) * toolTip)) + '%',
                    transform: 'translateX(-50%)'
                }}>
                <div className="tool-tip-inner">
                    <div className="tool-tip-item">
                        <span>{xKey}</span>
                        <span>{lineChartData.value.data[0][toolTip][xKey]}</span>
                    </div>
                    {lineChartData.value.data.map((dataSet, dataSetIndex) =>
                        <div className="tool-tip-item" key={dataSetIndex}>
                            <span>{toolTipKeys[dataSetIndex]}</span>
                            <span>{lineChartData.value.data[dataSetIndex][toolTip][yKey]}</span>
                        </div>
                    )}
                    <span className="tool-tip-arrow" />
                    <span className="dashed-vertical-line" style={{ height: document.getElementById('chart').getBoundingClientRect().height + 'px' }} />
                </div>
            </div>
        )
    }

    useEffect(() => {
        lineChartHandler()

        window.addEventListener('resize', lineChartHandler)
        return () => window.removeEventListener('resize', lineChartHandler)
    }, [])

    return (
        <div id="multiple-data-set-line-chart" className="multiple-data-set-line-chart">
            <div className="chart-header">
                <span className="title">{title}</span>
                <div className="chart-color-info-div">
                    {colors.map((color, colorIndex) =>
                        <div className="chart-color-info-div-item" key={colorIndex}>
                            <span style={{ background: color }} />
                            <span>{toolTipKeys[colorIndex]}</span>
                        </div>
                    )}
                </div>
                {dataSliceOptions.length > 0 && <div className="buttons">
                    {dataSliceOptions.map((option, optionIndex) =>
                        <button onClick={() => { selectedSliceNumber.value = -option; lineChartHandler() }} key={optionIndex}>{option == 0 ? 'All' : option}</button>
                    )}
                </div>}
            </div>
            <div className="chart-wrapper">
                <div id="chart" className="chart">
                    {lineChartData.value && lineChartData.value.data.map((_, dataSetIndex) =>
                        lineChartData.value.data[dataSetIndex].map((dataSetItem, dataSetItemIndex) =>
                            <div className="dot" id={dataSetIndex} style={{ bottom: dataSetItem.distanceFromBottom + '%', left: dataSetItem.distanceFromLeft + '%', background: colors[dataSetIndex] }} key={dataSetItemIndex}>
                                <div className="dot-children" id={`dot-children-${yKey}-${dataSetIndex}-${dataSetItemIndex}`} />
                            </div>
                        )
                    )}
                    {lineChartData.value && lineChartData.value.data[0].map((_, index) =>
                        <div className="chart-value-columns" style={{ width: (100 / lineChartData.value.data[0].length) + '%' }} key={index}
                            onMouseOver={() => { toolTip.value = index; onHoverValueColumn(index) }}
                            onMouseLeave={() => { toolTip.value = -1; onMouseLeaveValueColumn(index) }} >
                            <span className="line-for-x-keys" style={{ display: ((index % Math.floor(lineChartData.value.data[0].length / 5) == 0)) ? 'block' : 'none' }} />
                        </div>
                    )}
                    <ToolTip />
                    {lineChartData.value && lineChartData.value.chartLineStyles.map((_, index) =>
                        lineChartData.value.chartLineStyles[index].map((item2, index2) =>
                            <span
                                className="chart-line" id={index} key={index2}
                                style={{
                                    bottom: item2.distanceFromBottom + '%',
                                    left: item2.distanceFromLeft + '%',
                                    width: item2.hipotenus + 'px',
                                    background: colors[index],
                                    transform: `rotate(${item2.degree}deg)`,
                                }}
                            />
                        )
                    )}
                    <div className="horizontal-back-lines">
                        {[...new Array(6)].map((_, index) => <span className="horizontal-back-line" key={index} />)}
                    </div>
                    <div className="vertical-back-lines">
                        {[...new Array(6)].map((_, index) => <span className="vertical-back-line" key={index} />)}
                    </div>
                </div>
            </div>
            <div className="chart-footer">
                {lineChartData.value && lineChartData.value.data[0].map((dataSetItem, dataSetItemIndex) =>
                    <span className="chart-footer-item" style={{
                        width: (100 / lineChartData.value.data[0].length) + '%',
                        visibility: ((dataSetItemIndex % Math.floor(lineChartData.value.data[0].length / 5) == 0)) ? 'auto' : 'hidden'
                    }} key={dataSetItemIndex}>
                        {dataSetItem[xKey]}
                    </span>
                )}
            </div>
        </div>
    )
}