import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import applySteelbunchBranding from '../../utils/apply-steelbunch-branding';

export default class OnboardIndexRoute extends Route {
    @service store;
    @service('onboarding-orchestrator') orchestrator;

    queryParams = {
        step: { refreshModel: false },
        session: { refreshModel: false },
        code: { refreshModel: false },
    };

    beforeModel() {
        // Resume from previous session if data exists in localStorage
        this.orchestrator.start(null, { resume: true });
    }

    async model() {
        const brand = await this.store.findRecord('brand', 1);
        return applySteelbunchBranding(brand);
    }
}
