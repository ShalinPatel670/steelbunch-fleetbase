import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import applySteelbunchBranding from '../../utils/apply-steelbunch-branding';

export default class InviteForUserRoute extends Route {
    @service store;

    async model() {
        const brand = await this.store.findRecord('brand', 1);
        return applySteelbunchBranding(brand);
    }
}
