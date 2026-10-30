// Phosphor Icons (duotone) — https://phosphoricons.com · MIT
import i_pen_nib from '@phosphor-icons/core/assets/duotone/pen-nib-duotone.svg?raw';
import i_browsers from '@phosphor-icons/core/assets/duotone/browsers-duotone.svg?raw';
import i_video_camera from '@phosphor-icons/core/assets/duotone/video-camera-duotone.svg?raw';
import i_megaphone from '@phosphor-icons/core/assets/duotone/megaphone-duotone.svg?raw';
import i_storefront from '@phosphor-icons/core/assets/duotone/storefront-duotone.svg?raw';
import i_rocket_launch from '@phosphor-icons/core/assets/duotone/rocket-launch-duotone.svg?raw';
import i_globe_hemisphere_west from '@phosphor-icons/core/assets/duotone/globe-hemisphere-west-duotone.svg?raw';
import i_buildings from '@phosphor-icons/core/assets/duotone/buildings-duotone.svg?raw';
import i_magnifying_glass from '@phosphor-icons/core/assets/duotone/magnifying-glass-duotone.svg?raw';
import i_file_text from '@phosphor-icons/core/assets/duotone/file-text-duotone.svg?raw';
import i_sparkle from '@phosphor-icons/core/assets/duotone/sparkle-duotone.svg?raw';
import i_paper_plane_tilt from '@phosphor-icons/core/assets/duotone/paper-plane-tilt-duotone.svg?raw';
import i_check from '@phosphor-icons/core/assets/duotone/check-duotone.svg?raw';
import i_arrow_down from '@phosphor-icons/core/assets/duotone/arrow-down-duotone.svg?raw';
import i_whatsapp_logo from '@phosphor-icons/core/assets/duotone/whatsapp-logo-duotone.svg?raw';
import i_instagram_logo from '@phosphor-icons/core/assets/duotone/instagram-logo-duotone.svg?raw';
import i_envelope_simple from '@phosphor-icons/core/assets/duotone/envelope-simple-duotone.svg?raw';
import i_house from '@phosphor-icons/core/assets/duotone/house-duotone.svg?raw';
import i_stack from '@phosphor-icons/core/assets/duotone/stack-duotone.svg?raw';
import i_bell_ringing from '@phosphor-icons/core/assets/duotone/bell-ringing-duotone.svg?raw';
import i_sign_out from '@phosphor-icons/core/assets/duotone/sign-out-duotone.svg?raw';
import i_tray from '@phosphor-icons/core/assets/duotone/tray-duotone.svg?raw';
import i_trash from '@phosphor-icons/core/assets/duotone/trash-duotone.svg?raw';
import i_monitor from '@phosphor-icons/core/assets/duotone/monitor-duotone.svg?raw';
import i_palette from '@phosphor-icons/core/assets/duotone/palette-duotone.svg?raw';
import i_list_checks from '@phosphor-icons/core/assets/duotone/list-checks-duotone.svg?raw';
import i_handshake from '@phosphor-icons/core/assets/duotone/handshake-duotone.svg?raw';
import i_chat_circle_dots from '@phosphor-icons/core/assets/duotone/chat-circle-dots-duotone.svg?raw';
import i_calendar_check from '@phosphor-icons/core/assets/duotone/calendar-check-duotone.svg?raw';
import i_squares_four from '@phosphor-icons/core/assets/duotone/squares-four-duotone.svg?raw';
import i_target from '@phosphor-icons/core/assets/duotone/target-duotone.svg?raw';
import i_lightning from '@phosphor-icons/core/assets/duotone/lightning-duotone.svg?raw';
import i_images from '@phosphor-icons/core/assets/duotone/images-duotone.svg?raw';

const RAW = {
  'pen-nib': i_pen_nib,
  'browsers': i_browsers,
  'video-camera': i_video_camera,
  'megaphone': i_megaphone,
  'storefront': i_storefront,
  'rocket-launch': i_rocket_launch,
  'globe-hemisphere-west': i_globe_hemisphere_west,
  'buildings': i_buildings,
  'magnifying-glass': i_magnifying_glass,
  'file-text': i_file_text,
  'sparkle': i_sparkle,
  'paper-plane-tilt': i_paper_plane_tilt,
  'check': i_check,
  'arrow-down': i_arrow_down,
  'whatsapp-logo': i_whatsapp_logo,
  'instagram-logo': i_instagram_logo,
  'envelope-simple': i_envelope_simple,
  'house': i_house,
  'stack': i_stack,
  'bell-ringing': i_bell_ringing,
  'sign-out': i_sign_out,
  'tray': i_tray,
  'trash': i_trash,
  'monitor': i_monitor,
  'palette': i_palette,
  'list-checks': i_list_checks,
  'handshake': i_handshake,
  'chat-circle-dots': i_chat_circle_dots,
  'calendar-check': i_calendar_check,
  'squares-four': i_squares_four,
  'target': i_target,
  'lightning': i_lightning,
  'images': i_images,
};
const ph = (name) => RAW[name].replace('<svg ', '<svg aria-hidden="true" class="ph" ');

export const icons = {
  brand: ph('pen-nib'),
  code: ph('browsers'),
  video: ph('video-camera'),
  megaphone: ph('megaphone'),
  sign: ph('storefront'),
  rocket: ph('rocket-launch'),
  globe: ph('globe-hemisphere-west'),
  building: ph('buildings'),
  search: ph('magnifying-glass'),
  file: ph('file-text'),
  sparkles: ph('sparkle'),
  send: ph('paper-plane-tilt'),
  check: ph('check'),
  arrow: ph('arrow-down'),
  whatsapp: ph('whatsapp-logo'),
  instagram: ph('instagram-logo'),
  mail: ph('envelope-simple'),
  home: ph('house'),
  layers: ph('stack'),
  bell: ph('bell-ringing'),
  logout: ph('sign-out'),
  inbox: ph('tray'),
  trash: ph('trash'),
  monitor: ph('monitor'),
  palette: ph('palette'),
  list: ph('list-checks'),
  handshake: ph('handshake'),
  chat: ph('chat-circle-dots'),
  calendar: ph('calendar-check'),
  grid: ph('squares-four'),
  target: ph('target'),
  bolt: ph('lightning'),
  images: ph('images'),
};
