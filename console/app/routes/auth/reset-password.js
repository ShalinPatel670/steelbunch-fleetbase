import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import applySteelbunchBranding from '../../utils/apply-steelbunch-branding';

export default class AuthResetPasswordRoute extends Route {
    @service store;
    @service fetch;
    @service router;
    @service notifications;
    @service intl;

    async model({ id }) {
        return this.fetch.get('auth/validate-verification', { id });
    }

    async setupController(controller, model) {
        super.setupController(...arguments);
        if (model.is_valid === false) {
            this.notifications.warning(this.intl.t('auth.reset-password.invalid-verification-code'));
            return this.router.transitionTo('auth');
        }

        // set brand to controller
        const brand = await this.store.findRecord('brand', 1);
        controller.brand = applySteelbunchBranding(brand);
    }
}
