function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
var result = ("UTS_" + pad(newSequenceNumber, 14, 0) + "_02").toString();
