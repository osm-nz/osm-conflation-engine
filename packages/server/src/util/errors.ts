import { ApiException } from 'chanfana';

export class GoneException extends ApiException {
  override isVisible = true;

  override default_message = 'Gone';

  override status = 410;

  override code = 7410;
}

export class PayloadTooLargeException extends ApiException {
  override isVisible = true;

  override default_message = 'Payload Too Large';

  override status = 413;

  override code = 7413;
}
