function createGenderlist(gender_pct) {
	// console.log('genderlist', gender_pct)

	var html_content = ''
	
	// loop through each noun, add data to word list
	for (var suffix in gender_pct) {
		// don't include if below count_cutoff_gender
		if (gender_pct[suffix].total < count_cutoff_gender) continue

		// get max pct so we know which one to bold
		var max = Math.max(gender_pct[suffix].f, gender_pct[suffix].m, gender_pct[suffix].n)

		// new row
		html_content = html_content + '<div class="row">'

		// suffix
		html_content = html_content + '<div class="col-5 gender-row"><b>' + suffix + '</b></div>'
		
		// fem. pct
		if (gender_pct[suffix].f == max) {
			html_content = html_content + '<div class="col-2"><b>' + Math.round(gender_pct[suffix].f * 1000) / 10 + '%</b></div>'
		} else {
			html_content = html_content + '<div class="col-2">' + Math.round(gender_pct[suffix].f * 1000) / 10 + '%</div>'
		}

		// masc. pct
		if (gender_pct[suffix].m == max) {
			html_content = html_content + '<div class="col-2"><b>' + Math.round(gender_pct[suffix].m * 1000) / 10 + '%</b></div>'
		} else {
			html_content = html_content + '<div class="col-2">' + Math.round(gender_pct[suffix].m * 1000) / 10 + '%</div>'
		}

		// neut. pct
		if (gender_pct[suffix].n == max) {
			html_content = html_content + '<div class="col-2"><b>' + Math.round(gender_pct[suffix].n * 1000) / 10 + '%</b></div>'
		} else {
			html_content = html_content + '<div class="col-2">' + Math.round(gender_pct[suffix].n * 1000) / 10 + '%</div>'
		}

		// // masc. pct
		// html_content = html_content + '<div class="col-2">' + Math.round(gender_pct[suffix].m * 1000) / 10 + '%</div>'
		
		// // neut. pct
		// html_content = html_content + '<div class="col-2">' + Math.round(gender_pct[suffix].n * 1000) / 10 + '%</div>'

		// end row
		html_content = html_content + '</div>'
	}

	$('#genderlist-list').html(html_content)
}

