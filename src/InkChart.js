import { LitElement, html } from '@polymer/lit-element';
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

        var margin = this.margin;

        this.svgRoot = Selection.select(this.shadowRoot.children[1]);
        this.svg = this.svgRoot.append("g");
        this.clip = this.svg.append("svg:clipPath")
                .attr("id", "clip")
            .append("svg:rect")
                .attr("id", "clip-rect")
                .attr("x", "0")
                .attr("y", "0");
        this.chart = this.svg.append("g")
            .attr("clip-path", "url(#clip)");

        this._initialized = true;
        this.requestUpdate();
    }

    get margin(){
        var margin = {
            top: 20, right: 20, bottom: 40, left: 50
        };
        margin.width = this.width - margin.left - margin.right;
        margin.height = this.height - margin.top - margin.bottom;
        return margin;
    }

    renderChart(margin){

        this.svgRoot.attr("width", this.width).attr("height", this.height);
        this.svg.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        this.clip.attr("width", margin.width).attr("height", margin.height);

        this.x = scale.scaleLinear()
            .range([0, margin.width])
            .domain(this.xlim);

        this.y = scale.scaleLinear()
            .range([margin.height, 0])
            .domain(this.ylim);

    }

    renderXAxis(margin){


        var xAxis = d3axis.axisBottom()
            .scale(this.x);

        if(this.gXAxis){
            this.gXAxis.remove();
        }

        this.gXAxis = this.svg.append("g");
        this.gXAxis
            .attr("class", "x axis")
            .attr("transform", "translate(0," + ((this.xAxisLocation === 'bottom')? margin.height : this.y(0)) + ")")
            .call(xAxis);

        var label = this.gXAxis.append("text")
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

        var yAxis = d3axis.axisLeft()
            .scale(this.y);

        if(this.gYAxis){
            this.gYAxis.remove();
        }

        this.gYAxis = this.svg.append("g");
        this.gYAxis
            .attr("class", "y axis")
            .attr("transform", "translate(" + ((this.yAxisLocation === 'left')? 0 : this.x(0)) + ", 0)")
            .call(yAxis);
        var label = this.gYAxis.append("text")
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
        var margin = this.margin;

        if(this._initialized){
            this.renderChart(margin);
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
            <svg></svg>
            <slot hidden></slot>
        `;
    }
}



customElements.define('ink-chart', InkChart);


class InkChartObject extends BaseGetProps {

    firstUpdated() {
        super.firstUpdated();
        this._initialized = true;
        this.requestUpdate();
    }

    get inkChart(){
        return this.closest('ink-chart');
    }

    render(){
        if(this._svgObject){
            this._svgObject.remove();
        }

        if(this._initialized){
            this._renderSVG(this.inkChart);
        }
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
        };
    }

    setDefaults() {
        this.x = 0.5;
        this.y = 0.5;
        this.r = 4.5;
        this.fill = this.inkChart.nextColor();
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

    _renderSVG(inkChart){
        this._svgObject = inkChart.chart.append("circle")
            .attr("r", this.r)
            .attr("fill", this.fill)
            .attr("cx", inkChart.x(this.x))
            .attr("cy", inkChart.y(this.y))
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

    _renderSVG(inkChart){

        // TODO: assumes sorted.
        var chartDomain = this.inkChart.xlim;
        var domain = this.domain || [-Infinity, Infinity];

        domain[0] = Math.max(domain[0], chartDomain[0]);
        domain[1] = Math.min(domain[1], chartDomain[1]);


        var step = (domain[1] - domain[0]) / this.samples;
        var data = d3array.range(domain[0] - step, domain[1] + step, step);

        // console.log(domain, data);

        var func = getIFrameFunction(this.iframe, this.eq, ['x']);

        this._svgObject = inkChart.chart.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke-width", this.strokeWidth)
            .attr("stroke-dasharray", this.strokeDasharray)
            .attr("stroke", this.stroke)
            .attr("d", d3shape.line()
            .defined(function(d) { return func(d); })
            .x(function(d) { return inkChart.x(d); })
            .y(function(d) { return inkChart.y(func(d)); }));
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

    _renderSVG(inkChart){
        this._svgObject = inkChart.chart.append("text")
            .text(this.text)
            .attr("x", inkChart.x(this.x))
            .attr("y", inkChart.y(this.y))
            .style("text-anchor", "end");
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

    dispatch(x, y){

        this.x = x;
        this.y = y;

        if(!this.bind){return;}

        var func = getIFrameFunction(this.iframe, this.bind, ['x', 'y']);
        var updates = func(x, y);

        var keys = Object.keys(updates);

        for (var i = 0; i < keys.length; i++) {
            const action = {
                type: 'UPDATE_VARIABLE',
                name: keys[i],
                value: updates[keys[i]]
            };
            this.store.dispatch(action);
        }
        console.log('Drag node updating var:', updates);
    }

    _renderSVG(inkChart){

        if(!this._node){
            this._node = inkChart.chart.append("circle")
                .attr("r", this.r)
                .attr("fill", this.fill)
                .attr("cx", inkChart.x(this.x))
                .attr("cy", inkChart.y(this.y));

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

                this.dispatch(
                    inkChart.x.invert(x),
                    inkChart.y.invert(y)
                );
            }).on('end', () => {
                this.dragging = false;
            });
            this._node.call(this.drag);
            return;
        }
        if(this.dragging){
            return;
        }

        this._node
            .attr("r", this.r)
            .attr("fill", this.fill)
            .attr("cx", inkChart.x(this.x))
            .attr("cy", inkChart.y(this.y));

    }

}

customElements.define('ink-chart-node', InkChartNode);


        // function img(id, src, xLoc, yLoc, wLoc, hLoc){
        //     if(imgs[id] !== undefined){imgs[id].img.remove();}
        //     var img = chart.append("svg:image")
        //         .attr("xlink:href", src)
        //         .attr("id", id)
        //         .attr("x", x(xLoc))
        //         .attr("y", y(yLoc + hLoc))
        //         .attr("width", x(wLoc) - x(0))
        //         .attr("height", y(0) - y(hLoc));
        //     imgs[id] = {img:img, src:src, rawData:{x:xLoc, y:yLoc, width:wLoc, height:hLoc}};





export { InkChart, InkChartPoint, InkChartLine, InkChartText, InkChartNode };
