async function loadQ3Chart() {  
    d3.select("#chart").html("");
    d3.select("#legend").html("");

    try {
        const rawData = await d3.json("/visualize/");
        const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

        const monthlySales = rawData.reduce((acc, d) => {
            const month = parseTime(d["Thời gian tạo đơn"]).getMonth() + 1;
            acc[month] = acc[month] || { revenue: 0, quantity: 0 };
            acc[month].revenue += +d["Thành tiền"];
            acc[month].quantity += +d["SL"];
            return acc;
        }, {});

 
        const dataset = Object.entries(monthlySales).map(([month, values]) => ({
            month: +month,
            doanhSo: values.revenue / 1e6, // triệu VND
            quantity: values.quantity,
            monthLabel: `Tháng ${String(month).padStart(2, "0")}`
        })).sort((a, b) => a.month - b.month);

        createBarChart(dataset);
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
}

function createBarChart(data) {
    const margin = { top: 70, right: 50, bottom: 80, left: 100 },
          width  = 900 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Doanh số bán hàng theo Tháng");

    const maxVal = d3.max(data, d => d.doanhSo);
    const y = d3.scaleLinear().domain([0, maxVal]).nice().range([height, 0]);
    const x = d3.scaleBand().domain(data.map(d => d.monthLabel)).range([0, width]).padding(0.2);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(data.map(d => d.month));

    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("padding", "6px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("visibility", "hidden");

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.monthLabel))
        .attr("y", d => y(d.doanhSo))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.doanhSo))
        .attr("fill", d => color(d.month))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>${d.monthLabel}</strong><br>
                    <strong>Doanh số:</strong> ${formatValue(d.doanhSo)} triệu VND<br>
                    <strong>Số lượng:</strong> ${d3.format(",")(d.quantity)} SKUs
                `);
        })
        .on("mousemove", event => {
            tooltip.style("top", `${event.pageY - 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));


    svg.selectAll(".bar-label")
        .data(data)
        .enter().append("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d.monthLabel) + x.bandwidth() / 2)
        .attr("y", d => y(d.doanhSo) - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .text(d => `${formatValue(d.doanhSo)} triệu`);

    // Trục X
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => `${d}M`));
}

const formatValue = million => million.toFixed(0).replace(".", ",");
