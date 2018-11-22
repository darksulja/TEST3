function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
var result = ("GMO_PR_" + pad(newSequenceNumber, 11, 0) + "_01").toString();
