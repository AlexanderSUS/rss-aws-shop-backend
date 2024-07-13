import { handler as basicAuthorizer } from '../authorization-service/basicAuthorizer';

const TOKEN = Buffer
  .from(`${process.env.GITHUB_ACCOUNT_LOGIN}:${process.env.AUTH_PASSWORD}`, 'utf-8')
  .toString('base64');

const INVALID_TOKEN = Buffer.from(`some_login:invalid_password`, 'base64').toString('utf8');

describe('authorization-service', () => {
  describe('basicAuthorizer', () => {
    test('should throw an error if header does not present', () => {
      expect.assertions(1);

      try {
        basicAuthorizer({ methodArn: 'anr', type: 'TOKEN', authorizationToken: undefined });
      } catch (err) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(err).toHaveProperty('message', 'Unauthorized');
      }
    });

    test('should return deny policy on invalid token', () => {
      const res = basicAuthorizer({ methodArn: 'arn', type: 'TOKEN', authorizationToken: INVALID_TOKEN });

      expect(res.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    test('should return allow policy on valid token', () => {
      const res = basicAuthorizer({ methodArn: 'arn', type: 'TOKEN', authorizationToken: TOKEN });

      expect(res.policyDocument.Statement[0].Effect).toBe('Allow');
    });
  });
});