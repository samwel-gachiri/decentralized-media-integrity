import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3Visualization = ({ data, type = 'bar', width = 600, height = 400, title = '' }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        const margin = { top: 40, right: 30, bottom: 60, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title
        if (title) {
            svg
                .append('text')
                .attr('x', width / 2)
                .attr('y', 20)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('font-weight', 'bold')
                .style('fill', '#1f2937')
                .text(title);
        }

        // Render based on visualization type
        switch (type) {
            case 'bar_chart':
                renderBarChart(g, data, innerWidth, innerHeight);
                break;
            case 'pie_chart':
                renderPieChart(g, data, innerWidth, innerHeight);
                break;
            case 'scatter_plot':
                renderScatterPlot(g, data, innerWidth, innerHeight);
                break;
            case 'line':
                renderLineChart(g, data, innerWidth, innerHeight);
                break;
            case 'metric':
                renderMetric(g, data, innerWidth, innerHeight);
                break;
            default:
                renderBarChart(g, data, innerWidth, innerHeight);
        }
    }, [data, type, width, height, title]);

    const renderBarChart = (g, data, width, height) => {
        const xScale = d3
            .scaleBand()
            .domain(data.map(d => d.name || d.label))
            .range([0, width])
            .padding(0.1);

        const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([height, 0]);

        // Color scale
        const colorScale = d3
            .scaleOrdinal()
            .domain(data.map(d => d.name || d.label))
            .range(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']);

        // Add bars
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.name || d.label))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.value))
            .attr('fill', d => colorScale(d.name || d.label))
            .attr('opacity', 0.8)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 1);

                // Tooltip
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0, 0, 0, 0.8)')
                    .style('color', 'white')
                    .style('padding', '8px')
                    .style('border-radius', '4px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);

                tooltip.transition().duration(200).style('opacity', 1);
                tooltip
                    .html(`<strong>${d.name || d.label}</strong><br/>Value: ${d.value}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).attr('opacity', 0.8);
                d3.selectAll('.tooltip').remove();
            });

        // Add x-axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        // Add y-axis
        g.append('g').call(d3.axisLeft(yScale));
    };

    const renderPieChart = (g, data, width, height) => {
        const radius = Math.min(width, height) / 2;
        const centerX = width / 2;
        const centerY = height / 2;

        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(radius - 10);

        const colorScale = d3
            .scaleOrdinal()
            .domain(data.map(d => d.name))
            .range(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']);

        const pieGroup = g
            .append('g')
            .attr('transform', `translate(${centerX},${centerY})`);

        const arcs = pieGroup
            .selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs
            .append('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data.name))
            .attr('opacity', 0.8)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 1);

                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0, 0, 0, 0.8)')
                    .style('color', 'white')
                    .style('padding', '8px')
                    .style('border-radius', '4px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);

                tooltip.transition().duration(200).style('opacity', 1);
                tooltip
                    .html(`<strong>${d.data.name}</strong><br/>Value: ${d.data.value}<br/>Percentage: ${d.data.percentage?.toFixed(1)}%`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).attr('opacity', 0.8);
                d3.selectAll('.tooltip').remove();
            });

        // Add labels
        arcs
            .append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', 'white')
            .text(d => d.data.percentage > 10 ? d.data.name : '');
    };

    const renderScatterPlot = (g, data, width, height) => {
        const xScale = d3
            .scaleLinear()
            .domain(d3.extent(data, d => d.x))
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain(d3.extent(data, d => d.y))
            .range([height, 0]);

        const colorScale = d3
            .scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']);

        // Add dots
        g.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 6)
            .attr('fill', d => colorScale(d.label))
            .attr('opacity', 0.7)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 8).attr('opacity', 1);

                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0, 0, 0, 0.8)')
                    .style('color', 'white')
                    .style('padding', '8px')
                    .style('border-radius', '4px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);

                tooltip.transition().duration(200).style('opacity', 1);
                tooltip
                    .html(`<strong>${d.label}</strong><br/>X: ${d.x}<br/>Y: ${d.y}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 6).attr('opacity', 0.7);
                d3.selectAll('.tooltip').remove();
            });

        // Add x-axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        // Add y-axis
        g.append('g').call(d3.axisLeft(yScale));
    };

    const renderLineChart = (g, data, width, height) => {
        const xScale = d3
            .scaleLinear()
            .domain(d3.extent(data, (d, i) => i))
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain(d3.extent(data, d => d.value))
            .range([height, 0]);

        const line = d3
            .line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX);

        // Add line
        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Add dots
        g.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', (d, i) => xScale(i))
            .attr('cy', d => yScale(d.value))
            .attr('r', 4)
            .attr('fill', '#3b82f6');

        // Add x-axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        // Add y-axis
        g.append('g').call(d3.axisLeft(yScale));
    };

    const renderMetric = (g, data, width, height) => {
        // Large metric display
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '48px')
            .style('font-weight', 'bold')
            .style('fill', '#3b82f6')
            .text(data.primary_metric || data.total || 'N/A');

        // Subtitle
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2 + 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('fill', '#6b7280')
            .text('Total Result');
    };

    return (
        <div className="d3-visualization">
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default D3Visualization;