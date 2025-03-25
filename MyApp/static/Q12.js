function loadQ12Chart() {
    d3.select("#chart").html("");

    d3.json("/visualize/").then(function (data) {
        
        const totalSpentByCustomer = d3.rollup(
            data,
            v => d3.sum(v, d => +d["Thành tiền"]),
            d => d["Mã khách hàng"]
        );

        
        const bins = d3.bin()
            .domain([0, d3.max(totalSpentByCustomer.values())])
            .thresholds(d3.range(0, d3.max(totalSpentByCustomer.values()) + 50000, 50000))
            (Array.from(totalSpentByCustomer.values()));

        let dataset = bins.map(bin => ({
            range: `${(bin.x0 / 1000).toFixed(0)}K`, 
            x0: bin.x0, 
            x1: bin.x1,  
            count: bin.length
        }));

        const margin = { top: 50, right: 50, bottom: 120, left: 100 },
              width = 1200 - margin.left - margin.right,
              height = 500 - margin.top - margin.bottom;

        const svg = d3.select("#chart").append("svg")
                      .attr("width", width + margin.left + margin.right)
                      .attr("height", height + margin.top + margin.bottom)
                      .append("g")
                      .attr("transform", `translate(${margin.left},${margin.top})`);

        
        svg.append("text")
           .attr("x", width / 2)
           .attr("y", -20)
           .attr("text-anchor", "middle")
           .style("font-size", "20px")
           .style("font-weight", "bold")
           .text("Phân phối Mức chi trả của Khách hàng");

        const x = d3.scaleBand().domain(dataset.map(d => d.range)).range([0, width]).padding(0.2);
        const y = d3.scaleLinear().domain([0, d3.max(dataset, d => d.count)]).nice().range([height, 0]);

   
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ddd")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)")
            .style("font-size", "12px")
            .style("visibility", "hidden");

   
        svg.selectAll(".bar")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.range))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.count))
            .attr("fill", "#4B8BBE")
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>Đã chi tiêu Từ ${d.x0.toLocaleString()} đến ${d.x1.toLocaleString()}</strong><br>
                        <span style="color: #666;">Số lượng KH :</span> <strong>${d.count}</strong>
                    `);
            })
            .on("mousemove", function (event) {
                tooltip.style("top", `${event.pageY - 10}px`)
                       .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
            });


        svg.append("g")
           .attr("transform", `translate(0, ${height})`)
           .call(d3.axisBottom(x))
           .selectAll("text")
           .attr("transform", "rotate(-45)")
           .style("text-anchor", "end");


        svg.append("g")
           .call(d3.axisLeft(y).ticks(6));

    }).catch(error => console.error("Lỗi khi đọc CSV:", error));
}