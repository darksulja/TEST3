//Used For Content Versioning Material ID Generator
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
var result = ("GMO_" + pad(newSequenceNumber, 14, 0) + "_03").toString();
