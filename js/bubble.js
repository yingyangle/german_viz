function createBubble() {

	let width = 500
	let height = 500
	var center = { x: width / 2 , y: height / 2 + 900 }

	var bubble_title = 'Plural Endings Distribution'
	var bubble_type = 'Plural'
	var bubble_nodes

	// create svg
	const svg = d3.select('#bubble').append('svg')
		.attr('viewBox', [-width / 2, -height / 2, width, height])
	
	// filter and format data
	function get_data() {
		bubble_nodes = nodes
		bubble_links = links
		console.log('bubble', data, bubble_nodes, bubble_links)

		// filter nodes to show correct type (plural or singular)
		// bubble_nodes = bubble_nodes.filter(node => {
		// 	return node.type != selected_type // & node.count >= count_cutoff
		// })

		// filter nodes according to selected ending
		var nodes_to_remove = []
		var j
		if (selected_i != -1) {
			// adjust count according to selected ending
			for (var i in bubble_nodes) {
				var node = bubble_nodes[i]
				// find link from selected singular to current plural node
				if (selected_type == 'singular') {
					j = bubble_links.findIndex(x => x.source == selected_i & x.target == i)
				} else { // find link from current singular node to selected plural
					j = bubble_links.findIndex(x => x.source == i & x.target == selected_i)
				}
				// if link not found
				if (j == -1) {
					nodes_to_remove.push(node)
				} else { // set node count as link count 
					node.count = bubble_links[j].value
				}
			}
			// remove nodes with 0 count
			bubble_nodes = bubble_nodes.filter(node => {
				return !nodes_to_remove.includes(node)
			})
		}

		const maxSize = d3.max(bubble_nodes, d => +d.count)
		
		// size bubbles based on area
		const radiusScale = d3.scaleSqrt()
			.domain([0, maxSize])
			.range([0, 80])
		
		// format nodes info
		bubble_nodes = bubble_nodes.map(d => ({
			...d,
			radius: radiusScale(+d.count),
			size: +d.count,
			x: Math.random() * -200,
			y: Math.random() * 100
		}))

		console.log('bubble nodes', bubble_nodes)
		return bubble_nodes
	}

	// update bubble chart
	function update() {

		// clear svg contents
		svg.selectAll('*').remove()

		bubble_nodes = get_data()

		// charge is dependent on size of the bubble, so bigger towards the middle
		function charge(d) {
			return Math.pow(d.radius, 2.0) * 0.01
		}

		const force = d3.forceSimulation(bubble_nodes)
			.force('charge', d3.forceManyBody().strength(charge))
			.force('center', d3.forceCenter())
			.force('x', d3.forceX().strength(0.07).x(center.x))
			.force('y', d3.forceY().strength(0.07).y(center.y))
			.force('collision', d3.forceCollide().radius(d => d.radius + 1))

		force.stop()
		
		// create node as circles
		var node = svg.selectAll('g')
			.data(bubble_nodes)
			.enter()
			.append('g')

		let bubbles = node.append('circle')
			.classed('bubble', true)
			.attr('class', 'node')
			.attr('r', d => d.radius)
			.attr('fill', d => colorScale_plurals(d.name))
			.attr('opacity', 0.6)
			.call(drag(force))
			.on('mouseover.tooltip', function(d) {
				tooltip.transition()
					.duration(200)
					.style('font-family', 'Nunito Sans')
					.style('padding', '10px')
					.style('opacity', 0.9)
				tooltip.html(bubble_type + ' Type: <b>' + d.name + '</b><br>' + `${f(d.count)} words`)
					.style('left', (d3.event.pageX) + 'px')
					.style('top', (d3.event.pageY + 10) + 'px')
			})
			.on('mouseout.tooltip', function() {
				tooltip.transition()
					.duration(200)
					.style('opacity', 0)
			})
			.on('mousemove', function() {
				tooltip.style('left', (d3.event.pageX) + 'px')
					.style('top', (d3.event.pageY + 10) + 'px')
			})

		// circle labels
		let labels = node.append('text')
			.text(d => d.name)
			.style('font-size', '18px')
			.attr('class', 'nunito')
			.attr('fill', '#4d4b47')
			.attr('x', 0)
			.attr('y', 0)
			.attr('text-anchor', 'middle')
			.call(drag(force))
			.on('mouseover.tooltip', function(d) {
				tooltip.transition()
					.duration(200)
					.style('font-family', 'Nunito Sans')
					.style('padding', '10px')
					.style('opacity', .9)
				tooltip.html(bubble_type + ' Type: <b>' + d.name + '</b><br>' + `${f(d.count)} words`)
					.style('left', (d3.event.pageX) + 'px')
					.style('top', (d3.event.pageY + 10) + 'px')
			})
			.on('mouseout.tooltip', function() {
				tooltip.transition()
					.duration(200)
					.style('opacity', 0)
			})
			.on('mousemove', function() {
				tooltip.style('left', (d3.event.pageX) + 'px')
					.style('top', (d3.event.pageY + 10) + 'px')
			})

		// tooltip
		var tooltip = d3.select('body')
			.append('div')
			.attr('class', 'tooltip')
			.style('opacity', 0)

		// title
		svg.append('text')
			.attr('x', 0)
			.attr('y', -200)
			.attr('text-anchor', 'middle')
			.style('font-size', '40px')
			.style('fill', '#4d4b47')
			.text(bubble_title)


		// called each time the simulation ticks
		// each tick, take new x and y values for each link and circle, x y values calculated by d3 and appended to our dataset objects
		force.on('tick', () => {
			bubbles
				.attr('cx', d => d.x)
				.attr('cy', d => d.y)

			labels
				.attr('x', d => d.x)
				.attr('y', d => d.y)
			})
			.restart()

		console.log('UPDATED BUBBLE !')
	}
	
	update()

	$('#sankey-range').on('change', () => {
		$('.sankey-node').on('click', () => {
			update()
		})
		update()
	})

	$('.sankey-node').on('click', () => {
		update()
	})

	$('#show-all-singulars').on('click', () => {
		selected_ending = ''
		selected_type = 'plural'
		bubble_title = 'Singular Endings Distribution'
		bubble_type = 'Singular'
		$('#selected-ending').html('All Singulars')
		$('#selected-type').html('')
		update()
	})

	$('#show-all-plurals').on('click', () => {
		selected_ending = ''
		selected_type = 'singular'
		bubble_title = 'Plural Endings Distribution'
		bubble_type = 'Plural'
		$('#selected-ending').html('All Plurals')
		$('#selected-type').html('')
		update()
	})
}