import { LitElement, html, svg } from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';

import { BaseGetProps, propDef, getProp, setProp, getPropFunction, getIFrameFunction } from './InkDynamicProps.js';

const Selection = require('d3-selection');
// const d3scale = require('d3-scale');
import * as scale from 'd3-scale'
const d3axis = require('d3-axis');
const d3array = require('d3-array');
const d3shape = require('d3-shape');
const Drag = require('d3-drag');

const d3ScaleChromatic = require('d3-scale-chromatic');


class InkChart extends BaseGetProps {
    static get properties() {
        return {
            width: Number,
            height: Number,
            ...propDef('xlim', Array),
            ...propDef('ylim', Array),
            xlabel: String,
            ylabel: String,
            xAxisLocation: {
                type: String,
                attribute: 'x-axis-location'
            },
            yAxisLocation: {
                type: String,
                attribute: 'y-axis-location'
            },
        };
    }
    setDefaults() {
        this.width = 700;
        this.height = 400;
        this.xlim = [0, 1];
        this.ylim = [0, 1];
        this.xlabel = '';
        this.ylabel = '';
        this.xAxisLocation = 'bottom';
        this.yAxisLocation = 'left';
    }

    firstUpdated(){
        super.firstUpdated();
        this._initialized = true;
        this.requestUpdate();
    }

    get margin(){
        let margin = {
            top: 20, right: 20, bottom: 40, left: 50
        };
        margin.width = this.width - margin.left - margin.right;
        margin.height = this.height - margin.top - margin.bottom;
        return margin;
    }

    updateDomainAndRange(margin){

        this.x = scale.scaleLinear()
            .range([0, margin.width])
            .domain(this.xlim);

        this.y = scale.scaleLinear()
            .range([margin.height, 0])
            .domain(this.ylim);

    }

    renderXAxis(margin){

        let xAxis = d3axis.axisBottom()
            .scale(this.x);

        this.gXAxis = Selection.select(this.shadowRoot.children[1].children[0].children[1]);
        this.gXAxis.html(null);
        this.gXAxis
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ((this.xAxisLocation === 'bottom')? margin.height : this.y(0)) + ")")
            .call(xAxis);

        let label = this.gXAxis.append("text")
            .style("text-anchor", "middle")
            .attr("fill", "#333")
            .text(this.xlabel);
        if(this.xAxisLocation === 'bottom'){
            label.attr("dy", 30).attr("x", margin.width / 2);
        }else{
            label.attr("dy", -5).attr("x", margin.width)
            .style("text-anchor", "end");
        }

    }

    renderYAxis(margin){

        let yAxis = d3axis.axisLeft()
            .scale(this.y);

        this.gYAxis = Selection.select(this.shadowRoot.children[1].children[0].children[2]);
        this.gYAxis.html(null);
        this.gYAxis
            .attr("class", "y axis")
            .attr("transform", "translate(" + ((this.yAxisLocation === 'left')? 0 : this.x(0)) + ", 0)")
            .call(yAxis);
        let label = this.gYAxis.append("text")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("fill", "#333")
            .text(this.ylabel);

        if(this.yAxisLocation === 'left'){
            label.attr("dy", -35).attr("x", -margin.height / 2);
        }else{
            label.attr("dy", 15).attr("x", 0)
            .style("text-anchor", "end");
        }
    }

    get xlim() { return getProp(this, 'xlim'); }
    set xlim(val) { return setProp(this, 'xlim', val); }
    get xlimFunction() { return getPropFunction(this, 'xlim'); }

    // ylim
    get ylim() { return getProp(this, 'ylim'); }
    set ylim(val) { return setProp(this, 'ylim', val); }
    get ylimFunction() { return getPropFunction(this, 'ylim'); }

    nextColor(){
        this._nextColor = this._nextColor || 0;
        this._nextColor ++;
        return d3ScaleChromatic.schemeCategory10[this._nextColor % 10];
    }

    render() {
        let margin = this.margin;

        if(this._initialized){
            this.updateDomainAndRange(margin);
            this.renderXAxis(margin);
            this.renderYAxis(margin);
        }


        return html`
            <style>
                svg {
                  font: 11px sans-serif;
                }
                .axis path,
                .axis line {
                  fill: none;
                  stroke: #000;
                  shape-rendering: crispEdges;
                }
                .x.axis path {
                  /*display: none;*/
                }
                .figure svg, .figure div{
                    position: relative;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
            </style>
            <svg width="${this.width}" height="${this.height}">
                <g transform="translate(${margin.left},${margin.top})">
                    <clipPath id="clip"><rect id="clip-rect" x="0" y="0" width="${margin.width}" height="${margin.height}"></rect></clipPath>
                    <g class="x axis"></g>
                    <g class="x axis"></g>
                    <g clip-path="url(#clip)">
                        ${[...this.children].map(child =>{
                            if(this._initialized && (child instanceof InkChartObject)){
                                return child.renderSVG(this);
                            }
                        })}
                    </g>
                </g>
            </svg>
        `;
    }
}



customElements.define('ink-chart', InkChart);


class InkChartObject extends BaseGetProps {

    get inkChart(){
        return this.closest('ink-chart');
    }

    render(){
        // The parent needs to render - but this will just be called too many times.
        // this.inkChart.requestUpdate();
        return html``;
    }

}



class InkChartPoint extends InkChartObject {

    static get properties() {
        return {
            ...propDef('x', Number),
            ...propDef('y', Number),
            ...propDef('r', Number),
            fill: String,
            stroke: String,
            strokeWidth: {
                type: Number,
                attribute: 'stroke-width'
            },
            strokeDasharray: {
                type: String,
                attribute: 'stroke-dasharray'
            }
        };
    }

    setDefaults() {
        this.x = 0.5;
        this.y = 0.5;
        this.r = 4.5;
        this.fill = this.inkChart.nextColor();
        this.stroke = undefined;
        this.strokeWidth = 1;
        this.strokeDasharray = undefined;
    }

    get x() { return getProp(this, 'x'); }
    set x(val) { return setProp(this, 'x', val); }
    get xFunction() { return getPropFunction(this, 'x'); }

    get y() { return getProp(this, 'y'); }
    set y(val) { return setProp(this, 'y', val); }
    get yFunction() { return getPropFunction(this, 'y'); }


    get r() { return getProp(this, 'r'); }
    set r(val) { return setProp(this, 'r', val); }
    get rFunction() { return getPropFunction(this, 'r'); }

    renderSVG(chart){
        return svg`<circle r="${this.r}" fill="${this.fill}" cx="${chart.x(this.x)}" cy="${chart.y(this.y)}" stroke="${this.stroke}" stroke-width="${this.strokeWidth}" stroke-dasharray="${this.strokeDasharray}"></circle>`;
    }
}

customElements.define('ink-chart-point', InkChartPoint);



class InkChartLine extends InkChartObject {
    static get properties() {
        return {
            ...propDef('eq', String),
            ...propDef('domain', Array),
            samples: Number,
            stroke: String,
            strokeWidth: {
                type: Number,
                attribute: 'stroke-width'
            },
            strokeDasharray: {
                type: String,
                attribute: 'stroke-dasharray'
            }
        };
    }

    setDefaults() {
        this.eq = 0;
        this.samples = 500; // Number of samples for an equation
        this.stroke = this.inkChart.nextColor();
        this.strokeWidth = 1.5;
        this.strokeDasharray = undefined;
        this.domain = undefined;
    }

    get eq() { return getProp(this, 'eq'); }
    set eq(val) { return setProp(this, 'eq', val); }
    get eqFunction() { return getPropFunction(this, 'eq'); }

    get domain() { return getProp(this, 'domain'); }
    set domain(val) { return setProp(this, 'domain', val); }
    get domainFunction() { return getPropFunction(this, 'domain'); }

    renderSVG(chart){

        // TODO: assumes sorted.
        let chartDomain = chart.xlim;
        let domain = this.domain || [-Infinity, Infinity];

        domain[0] = Math.max(domain[0], chartDomain[0]);
        domain[1] = Math.min(domain[1], chartDomain[1]);

        let step = (domain[1] - domain[0]) / this.samples;
        let data = d3array.range(domain[0] - step, domain[1] + step, step);
        let func = getIFrameFunction(this.iframe, this.eq, ['x']);

        let path = d3shape.line()
            .defined(function(d) { return isFinite(func(d)); })
            .x(function(d) { return chart.x(d); })
            .y(function(d) { return chart.y(func(d)); });

        return svg`<path class="line" fill="none" stroke="${this.stroke}" stroke-width="${this.strokeWidth}" stroke-dasharray="${this.strokeDasharray}" d="${path(data)}"></path>`
    }

}

customElements.define('ink-chart-line', InkChartLine);



class InkChartText extends InkChartObject {
    static get properties() {
        return {
            ...propDef('x', Number),
            ...propDef('y', Number),
            ...propDef('text', String),
        };
    }

    setDefaults() {
        this.x = 0.5;
        this.y = 0.5;
        this.text = 'Hello World';
    }

    get x() { return getProp(this, 'x'); }
    set x(val) { return setProp(this, 'x', val); }
    get xFunction() { return getPropFunction(this, 'x'); }

    get y() { return getProp(this, 'y'); }
    set y(val) { return setProp(this, 'y', val); }
    get yFunction() { return getPropFunction(this, 'y'); }

    get text() { return getProp(this, 'text'); }
    set text(val) { return setProp(this, 'text', val); }
    get textFunction() { return getPropFunction(this, 'text'); }

    renderSVG(chart){
        return svg`<text x="${chart.x(this.x)}" y="${chart.y(this.y)}" style="text-anchor: end;">${this.text}</text>`
    }

}

customElements.define('ink-chart-text', InkChartText);


class InkChartNode extends InkChartObject {
    static get properties() {
        return {
            // name: String,
            // description: String,
            ...propDef('x', Number),
            ...propDef('y', Number),
            r: String,
            fill: String,
            bind: String,
        };
    }

    setDefaults() {
        // this.name = 'temp';
        this.bind = '';
        // this.description = '';
        this.x = 0.5;
        this.y = 0.5;
        this.r = 20;
        this.fill = this.inkChart.nextColor();
    }

    get x() { return getProp(this, 'x'); }
    set x(val) { return setProp(this, 'x', val); }
    get xFunction() { return getPropFunction(this, 'x'); }

    get y() { return getProp(this, 'y'); }
    set y(val) { return setProp(this, 'y', val); }
    get yFunction() { return getPropFunction(this, 'y'); }

    dispatch(rawX, rawY){

        let x = this.inkChart.x.invert(rawX);
        let y = this.inkChart.y.invert(rawY);

        this.x = x;
        this.y = y;

        if(!this.bind){return;}

        let func = getIFrameFunction(this.iframe, this.bind, ['x', 'y']);
        let updates = func(x, y);

        let keys = Object.keys(updates);

        for (let i = 0; i < keys.length; i++) {
            const action = {
                type: 'UPDATE_VARIABLE',
                name: keys[i],
                value: updates[keys[i]]
            };
            this.store.dispatch(action);
        }
    }

    renderSVG(chart){
        // wrap the function handler, as it is called in a different event context.
        function wrapper(drag){
            return (e) => drag.setupDrag(e);
        }
        return svg`<circle r="${this.r}" fill="${this.fill}" cx="${chart.x(this.x)}" cy="${chart.y(this.y)}" @mouseover=${wrapper(this)}></circle>`;
    }

    setupDrag(event){
        // Lazy setup the drag events
        // This is only called once
        let rawNode = event.path[0];
        if(rawNode._drag !== undefined){
            return;
        }
        this._node = Selection.select(rawNode);
        this.drag = Drag.drag().on('start', () => {
            Selection.event.sourceEvent.preventDefault();
            this.dragging = true;
            this._prevValue = this.value; // Start out with the actual value
        }).on('drag', () => {
            Selection.event.sourceEvent.preventDefault();

            const x = Selection.event.x;
            const y = Selection.event.y;

            this._node
                .attr("cx", x)
                .attr("cy", y);

            this.dispatch(x, y);
        }).on('end', () => {
            this.dragging = false;
        });
        this._node.call(this.drag);

        // Remember to put the drag function on the rawNode:
        rawNode._drag = this.drag;
    }
}

customElements.define('ink-chart-node', InkChartNode);


        // function img(id, src, xLoc, yLoc, wLoc, hLoc){
        //     if(imgs[id] !== undefined){imgs[id].img.remove();}
        //     let img = chart.append("svg:image")
        //         .attr("xlink:href", src)
        //         .attr("id", id)
        //         .attr("x", x(xLoc))
        //         .attr("y", y(yLoc + hLoc))
        //         .attr("width", x(wLoc) - x(0))
        //         .attr("height", y(0) - y(hLoc));
        //     imgs[id] = {img:img, src:src, rawData:{x:xLoc, y:yLoc, width:wLoc, height:hLoc}};





export { InkChart, InkChartPoint, InkChartLine, InkChartText, InkChartNode };