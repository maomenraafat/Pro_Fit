function formatDuration(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return [
    `${days.toString().padStart(2, '0')} d`,
    `${hours.toString().padStart(2, '0')} h`,
    `${minutes.toString().padStart(2, '0')} m`,
    `${remainingSeconds.toString().padStart(2, '0')} s`
  ].join(' : ');
}


  export default formatDuration;
