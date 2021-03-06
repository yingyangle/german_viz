var link 

function createSankey() {
	let m = 90
	let margin = ({ top: 50, right: m, bottom: 10, left: m })
	let width = 700
	let height = 720

	var edgeColor = 'path' // color of links

	// create svg
	let svg = d3.select('#sankey')
		.attr('viewBox', [0,0, width, height])
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

	width = width - margin.left - margin.right
	height = height - margin.top - margin.bottom

	let _sankey = d3.sankey()
		.nodeWidth(30)
		.nodePadding(4)
		.extent([[1, 1], [width - 1, height - 5]])

	let sankey = ({nodes, links}) => _sankey({
		nodes: nodes.map(d => Object.assign({}, d)),
		links: links.map(d => Object.assign({}, d))
	})
	
	// get original data, filter data, convert to sankey data
	function getData() {
		// set data to original full data
		data = _.cloneDeep(data_orig)

		// find nodes to remove
		var nodes_to_remove = []
		for (var i in data.nodes) {
			n = data.nodes[i]
			if (n.count < count_cutoff_plural) {
				nodes_to_remove.push(n.i)
			} 
		}
		// remove nodes with count < count_cutoff_plural
		data.nodes = data.nodes.filter(node => {
			return node.count > count_cutoff_plural
		})

		// get index of singular 'other' type and plural 'other' type
		var other_singular = data.nodes.findIndex(x => x.name == 'other' & x.type == 'singular')
		var other_plural = data.nodes.findIndex(x => x.name == 'other' & x.type == 'plural')

		var other_singular_add = 0, other_plural_add = 0

		// update source and target indices for links
		for (var i in data.links) {
			l = data.links[i]
			// source (singular)
			if (nodes_to_remove.includes(l.source)) {
				l.source = other_singular
				other_singular_add += 1
			} else {
				l.source = data.nodes.findIndex(x => x.i == l.source)
			}
			// target (plural)
			if (nodes_to_remove.includes(l.target)) {
				l.target = other_plural
				other_plural_add += 1
			} else {
				l.target = data.nodes.findIndex(x => x.i == l.target)
			}
		}
		// remove duplicate links
		var unique_links = []
		$.each(data.links, function(i, link){
			var i = unique_links.findIndex(x => x.source == link.source & x.target == link.target)
			// add new unique link
			if (i == -1) {
				unique_links.push(link)
			} else { // increment value on existing link
				unique_links[i].value += link.value
			}
		})
		data.links = unique_links

		// remove singular "other" type if other_flag == 0
		if (other_flag == 0) {
			// remove singular "other" type from nodes
			data.nodes = data.nodes.filter(node => {
				return !(node.name == 'other' & node.type == 'singular')
			})
			// remove singular "other" type from links
			data.links = data.links.filter(node => {
				return node.source != other_singular
			})
		}
		nodes = data.nodes
		links = data.links
		
		// convert data to sankey data
		var sankey_data = sankey(data)
		var sankey_nodes = sankey_data.nodes 
		var sankey_links = sankey_data.links
		// console.log('sankey nodes', sankey_nodes)
		// console.log('sankey links', sankey_links)

		return {sankey_nodes, sankey_links}
	}
	
	// UPDATE FUNCTION
	// re-filter data, clear svg contents, draw new svg contents
	function update() {
		// get new count_cutoff_plural
		count_cutoff_plural = parseInt($('#sankey-range').val())
		// get new filtered data
		var sankey_data = getData()
		var sankey_nodes = sankey_data.sankey_nodes 
		var sankey_links = sankey_data.sankey_links
		selected_i = sankey_nodes.findIndex(x => x.name == selected_ending & x.type == selected_type)

		// clear svg contents
		svg.selectAll('*').remove()

		// nodes
		svg.append('g')
			// .attr('stroke', 'black') // outline
			.attr('opacity', 0.7)
			.selectAll('rect')
			.data(sankey_nodes)
			.join('rect')
			.attr('class', 'sankey-node')
			.attr('data-ending-type', d => d.type)
			.attr('x', d => d.x0)
			.attr('y', d => d.y0)
			.attr('height', d => d.y1 - d.y0)
			.attr('width', d => d.x1 - d.x0)
			.attr('fill', d => colorScale_plurals(d.name))
			.attr('opacity', 0.8)
			.on('click', function(d) {
				// update selection
				selected_ending = d.name
				selected_type = d.type
				selected_i = sankey_nodes.findIndex(x => x.name == selected_ending & x.type == selected_type)
				// plurals_total = sankey_nodes[selected_i].count
				// console.log('selected ending', selected_ending, selected_i)

				// highlight selected link
				link.selectAll('path').attr('opacity', 0.2)
				d3.selectAll('g[data-' + selected_type + '="' + d.name + '"]')
					.selectAll('path').attr('opacity', 1)
			})
			.on('mouseover', function(d) {
				// highlight selectedn node
				d3.select(this)
					.attr('opacity', 1)
				
				// highlight selected link
				link.selectAll('path').attr('opacity', 0.2)
				var current_type = d3.select(this).attr('data-ending-type')
				d3.selectAll('g[data-' + current_type + '="' + d.name + '"]')
					.selectAll('path').attr('opacity', 0.8)
			})
			.on('mouseout', function(d) {
				// unhighlight nodes
				d3.select(this)
						.attr('fill', d => colorScale_plurals(d.name))
						.attr('opacity', 0.8)
				
				// highlight links 
				if (selected_ending == '') {
					link.selectAll('path').attr('opacity', 1)
				} else {
					link.selectAll('path').attr('opacity', 0.2)
					d3.selectAll('g[data-' + selected_type + '="' + selected_ending + '"]')
						.selectAll('path').attr('opacity', 1)
				}
			})

		// links
		link = svg.append('g')
			.attr('class', 'link')
			.attr('fill', 'none')
			.attr('stroke-opacity', 0.4)
			.selectAll('g')
			.data(sankey_links)
			.join('g')
			.style('mix-blend-mode', 'multiply')
			.attr('data-singular', d => d.source.name)
			.attr('data-plural', d => d.target.name)

		// link colors
		if (edgeColor === 'path') {
			let gradient = link.append('linearGradient')
				.attr('id', (d,i) => {
					//  (d.uid = DOM.uid('link')).id
					let id = `link-${i}`
					d.uid = `url(#${id})`
					return id
				})
				.attr('gradientUnits', 'userSpaceOnUse')
				.attr('x1', d => d.source.x1)
				.attr('x2', d => d.target.x0)

			gradient.append('stop')
				.attr('offset', '0%')
				.attr('stop-color', d => colorScale_plurals(d.source.name))

			gradient.append('stop')
				.attr('offset', '100%')
				.attr('stop-color', d => colorScale_plurals(d.target.name))
		}

		link.append('path')
			.attr('d', d3.sankeyLinkHorizontal())
			.attr('stroke', d => edgeColor === 'path' ? d.uid
				: edgeColor === 'input' ? colorScale_plurals(d.source.name)
				: colorScale_plurals(d.target.name))
			// .attr('opacity', 0.2)
			.attr('stroke-width', d => Math.max(1, d.width))

		// tooltip on link hover
		link.on('mouseover.tooltip', function(d) {
				tooltip.transition()
					.duration(200)
					.style('opacity', .9)
				tooltip.html('<b>' + d.source.name + ' → ' + d.target.name + '</b><br>There are <b>' + `${f(d.value)}` + '</b> nouns ending with <b>' + d.source.name + '</b> which take the plural ending <b>' + d.target.name + '</b>')
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

		// node name labels
		svg.append('g')
			.selectAll('text')
			.data(sankey_nodes)
			.join('text')
			.attr('class', 'nunito')
			.attr('font-size', '16px')
			.attr('x', d => d.x0 < width / 2 ? d.x1 - 40 : d.x0 + 40)
			.attr('y', d => (d.y1 + d.y0) / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', d => d.x0 < width / 2 ? 'end' : 'start')
			.text(d => d.name)
		// node count labels
		svg.append('g')
			.selectAll('text')
			.data(sankey_nodes)
			.join('text')
			.attr('class', 'nunito')
			.attr('font-size', '16px')
			.attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
			.attr('y', d => (d.y1 + d.y0) / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
			.text(d => `${f(d.value)}`)
		// singular axis label
		svg.append('text')
			.attr('x', 4)
			.attr('y', -20)
			.attr('text-anchor', 'middle')
			.style('font-size', '26px')
			.style('fill', '#4d4b47')
			.text('Singular Ending')
		// plural axis label
		svg.append('text')
			.attr('x', width - 40)
			.attr('y', -20)
			.attr('text-anchor', 'middle')
			.style('font-size', '26px')
			.style('fill', '#4d4b47')
			.text('Plural Ending')
		
		// highlight links 
		if (selected_ending == '') {
			link.selectAll('path').attr('opacity', 1)
		} else {
			link.selectAll('path').attr('opacity', 0.2)
			d3.selectAll('g[data-' + selected_type + '="' + selected_ending + '"]')
				.selectAll('path').attr('opacity', 1)
		}
		// console.log('UPDATED SANKEY !')
	}
		
	update()

	// event listeners
	$('#sankey-range').on('change', () => {
		update()
	})
	$('#sankey-other-button').on('click', function() {
		if (other_flag) {
			other_flag = 0
			$('#sankey-other-button').html('Show "Other"')
			update()
		} else {
			other_flag = 1
			$('#sankey-other-button').html('Hide "Other"')
			update()
		}
	})
	$('#show-all-singulars, #show-all-plurals').on('click', () => {
		d3.selectAll('.link').selectAll('path').attr('opacity', 1)
	})

}
